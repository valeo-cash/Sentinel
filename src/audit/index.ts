import type { AuditRecord, AuditQuery, AuditSummary } from "../types/audit";
import type { AuditConfig } from "../types/config";
import type { PaymentContext } from "../types/index";
import type { BudgetViolation } from "../types/budget";
import type { StorageBackend } from "./storage/interface";
import { MemoryStorage } from "./storage/memory";
import { enrichBlockedRecord } from "./enrichment";
import { generateRecordId } from "../utils/id";
import { toCSV, toJSON } from "./export";

/** Central audit logger — writes records to a pluggable storage backend */
export class AuditLogger {
  private readonly storage: StorageBackend;
  private readonly enabled: boolean;
  private readonly redactFields: string[];

  constructor(config?: AuditConfig) {
    this.enabled = config?.enabled !== false;
    this.storage = config?.storage ?? new MemoryStorage();
    this.redactFields = config?.redactFields ?? [];
  }

  /** Log a completed payment record */
  async log(record: Omit<AuditRecord, "id" | "created_at">): Promise<AuditRecord> {
    const now = Date.now();
    const full: AuditRecord = {
      ...record,
      id: generateRecordId(record.agent_id, record.endpoint, now, record.amount),
      created_at: now,
    };

    const redacted = this.redact(full);

    if (this.enabled) {
      try {
        await this.storage.write(redacted);
      } catch (err) {
        console.warn("[sentinel] Audit write failed (non-fatal):", err);
      }
    }

    return redacted;
  }

  /** Log a blocked payment attempt */
  async logBlocked(
    context: PaymentContext,
    violation: BudgetViolation,
    config: { humanSponsor?: string; metadata?: Record<string, string> },
  ): Promise<AuditRecord> {
    const record = enrichBlockedRecord(context, {
      agentId: context.agentId,
      ...config,
    }, "blocked");
    record.metadata["violation_type"] = violation.type;
    record.metadata["violation_limit"] = violation.limit;

    if (this.enabled) {
      try {
        await this.storage.write(this.redact(record));
      } catch (err) {
        console.warn("[sentinel] Audit write failed (non-fatal):", err);
      }
    }

    return record;
  }

  /** Query audit records */
  async query(query: AuditQuery): Promise<AuditRecord[]> {
    return this.storage.query(query);
  }

  /** Get summary statistics */
  async summarize(query?: Partial<AuditQuery>): Promise<AuditSummary> {
    return this.storage.summarize(query ?? {});
  }

  /** Export records as CSV */
  async exportCSV(query?: AuditQuery): Promise<string> {
    const records = await this.storage.query(query ?? {});
    return toCSV(records);
  }

  /** Export records as JSON */
  async exportJSON(query?: AuditQuery): Promise<string> {
    const records = await this.storage.query(query ?? {});
    return toJSON(records, true);
  }

  /** Flush pending writes to storage */
  async flush(): Promise<void> {
    if ("flush" in this.storage && typeof this.storage.flush === "function") {
      await (this.storage as StorageBackend & { flush(): Promise<void> }).flush();
    }
  }

  /** Get the underlying storage backend (for dashboard integration) */
  getStorage(): StorageBackend {
    return this.storage;
  }

  private redact(record: AuditRecord): AuditRecord {
    if (this.redactFields.length === 0) return record;
    const copy = { ...record, metadata: { ...record.metadata } };
    for (const field of this.redactFields) {
      if (field in copy.metadata) {
        copy.metadata[field] = "[REDACTED]";
      }
    }
    return copy;
  }
}
