import { readFileSync, appendFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { AuditRecord, AuditQuery, AuditSummary } from "../../types/audit";
import type { StorageBackend } from "./interface";
import { matchesQuery, buildSummary } from "./memory";

/** JSONL file-based audit storage — appends one record per line */
export class FileStorage implements StorageBackend {
  private readonly filePath: string;
  private buffer: AuditRecord[] = [];
  private readonly flushThreshold: number;
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(filePath = ".valeo/audit.jsonl", flushThreshold = 100) {
    this.filePath = filePath;
    this.flushThreshold = flushThreshold;
    this.ensureDir();
    this.startAutoFlush();
  }

  async write(record: AuditRecord): Promise<void> {
    this.buffer.push(record);
    if (this.buffer.length >= this.flushThreshold) {
      await this.flush();
    }
  }

  async query(query: AuditQuery): Promise<AuditRecord[]> {
    await this.flush();
    const all = this.readAll();
    let results = all.filter((r) => matchesQuery(r, query));
    const offset = query.offset ?? 0;
    const limit = query.limit ?? results.length;
    return results.slice(offset, offset + limit);
  }

  async summarize(query: Partial<AuditQuery>): Promise<AuditSummary> {
    await this.flush();
    const records = this.readAll().filter((r) => matchesQuery(r, query));
    return buildSummary(records, query);
  }

  async count(query: Partial<AuditQuery>): Promise<number> {
    await this.flush();
    return this.readAll().filter((r) => matchesQuery(r, query)).length;
  }

  async getById(id: string): Promise<AuditRecord | null> {
    await this.flush();
    return this.readAll().find((r) => r.id === id) ?? null;
  }

  /** Write buffered records to disk */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    const lines = this.buffer.map((r) => JSON.stringify(r)).join("\n") + "\n";
    appendFileSync(this.filePath, lines, "utf-8");
    this.buffer = [];
  }

  /** Stop the auto-flush timer (for clean shutdown) */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  private readAll(): AuditRecord[] {
    if (!existsSync(this.filePath)) return [];
    const content = readFileSync(this.filePath, "utf-8");
    return content
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line) as AuditRecord);
  }

  private ensureDir(): void {
    const dir = dirname(this.filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  private startAutoFlush(): void {
    this.flushTimer = setInterval(() => {
      void this.flush();
    }, 5_000);
    this.flushTimer.unref();
  }
}
