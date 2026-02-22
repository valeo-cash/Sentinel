import type { AuditRecord, AuditQuery, AuditSummary } from "../../types/audit";
import type { StorageBackend } from "./interface";
import { MemoryStorage } from "./memory";

interface ApiStorageConfig {
  apiKey: string;
  baseUrl?: string;
  batchSize?: number;
  flushIntervalMs?: number;
}

/**
 * Remote API storage backend — batches and POSTs records to api.valeo.money.
 * Falls back to in-memory storage if the API is unreachable.
 */
export class ApiStorage implements StorageBackend {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly batchSize: number;
  private buffer: AuditRecord[] = [];
  private readonly fallback: MemoryStorage;
  private flushTimer: NodeJS.Timeout | null = null;
  private useFallback = false;

  constructor(config: ApiStorageConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? "https://api.valeo.money/v1";
    this.batchSize = config.batchSize ?? 50;
    this.fallback = new MemoryStorage();
    this.startAutoFlush(config.flushIntervalMs ?? 10_000);
  }

  async write(record: AuditRecord): Promise<void> {
    this.buffer.push(record);
    // Always write to fallback for local query support
    await this.fallback.write(record);
    if (this.buffer.length >= this.batchSize) {
      await this.flush();
    }
  }

  async query(query: AuditQuery): Promise<AuditRecord[]> {
    if (this.useFallback) return this.fallback.query(query);
    try {
      return await this.apiRequest<AuditRecord[]>("POST", "/audit/query", query);
    } catch {
      this.useFallback = true;
      return this.fallback.query(query);
    }
  }

  async summarize(query: Partial<AuditQuery>): Promise<AuditSummary> {
    if (this.useFallback) return this.fallback.summarize(query);
    try {
      return await this.apiRequest<AuditSummary>("POST", "/audit/summarize", query);
    } catch {
      this.useFallback = true;
      return this.fallback.summarize(query);
    }
  }

  async count(query: Partial<AuditQuery>): Promise<number> {
    if (this.useFallback) return this.fallback.count(query);
    try {
      const result = await this.apiRequest<{ count: number }>("POST", "/audit/count", query);
      return result.count;
    } catch {
      this.useFallback = true;
      return this.fallback.count(query);
    }
  }

  async getById(id: string): Promise<AuditRecord | null> {
    if (this.useFallback) return this.fallback.getById(id);
    try {
      return await this.apiRequest<AuditRecord | null>("GET", `/audit/${id}`);
    } catch {
      this.useFallback = true;
      return this.fallback.getById(id);
    }
  }

  /** Flush buffered records to the remote API */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    const batch = this.buffer.splice(0, this.batchSize);
    try {
      await this.apiRequest("POST", "/audit/batch", { records: batch });
    } catch {
      this.useFallback = true;
      console.warn(
        `[sentinel] API unreachable, falling back to in-memory storage. ${batch.length} records buffered locally.`,
      );
    }
  }

  /** Stop the auto-flush timer */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  private async apiRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const init: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
    };
    if (body) {
      init.body = JSON.stringify(body);
    }

    let lastError: Error | undefined;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetch(url, init);
        if (!response.ok) {
          throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }
        return (await response.json()) as T;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < 2) {
          await sleep(Math.pow(2, attempt) * 1000);
        }
      }
    }
    throw lastError;
  }

  private startAutoFlush(intervalMs: number): void {
    this.flushTimer = setInterval(() => {
      void this.flush();
    }, intervalMs);
    this.flushTimer.unref();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
