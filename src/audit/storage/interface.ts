import type { AuditRecord, AuditQuery, AuditSummary } from "../../types/audit";

/** Pluggable storage backend for audit records */
export interface StorageBackend {
  /** Persist a single audit record */
  write(record: AuditRecord): Promise<void>;
  /** Query records matching the given filter */
  query(query: AuditQuery): Promise<AuditRecord[]>;
  /** Compute aggregated summary statistics */
  summarize(query: Partial<AuditQuery>): Promise<AuditSummary>;
  /** Count records matching the given filter */
  count(query: Partial<AuditQuery>): Promise<number>;
  /** Retrieve a single record by its deterministic ID */
  getById(id: string): Promise<AuditRecord | null>;
}
