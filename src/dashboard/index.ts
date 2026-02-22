import type { AuditRecord, AuditQuery } from "../types/audit";
import type { StorageBackend } from "../audit/storage/interface";
import { spendByAgent, spendByTeam, spendByEndpoint } from "./queries";
import type { TimeRange } from "./queries";
import { parseUSDC, formatUSDCHuman } from "../utils/money";

/** Query parameters for dashboard spend queries */
export interface SpendQuery {
  agentId?: string;
  team?: string;
  endpoint?: string;
  range: TimeRange;
}

/** Aggregated spend report */
export interface SpendReport {
  totalSpend: string;
  count: number;
  byAgent: Record<string, { spend: string; count: number }>;
  byEndpoint: Record<string, { spend: string; count: number }>;
}

/** Summary for a single agent */
export interface AgentSummary {
  agentId: string;
  team: string | null;
  totalSpend: string;
  transactionCount: number;
  lastActive: number;
}

/** Alert from violations or anomaly detection */
export interface Alert {
  type: "violation" | "anomaly";
  record: AuditRecord;
  message: string;
}

export interface DashboardConfig {
  storage: StorageBackend;
  apiKey?: string;
  baseUrl?: string;
}

/**
 * Dashboard client for querying Sentinel audit data.
 * Runs queries locally against the configured StorageBackend.
 * Remote sync/export are stubs for future api.valeo.money integration.
 */
export class SentinelDashboard {
  private readonly storage: StorageBackend;
  /** @internal Reserved for future remote API integration */
  readonly apiKey?: string;
  /** @internal Reserved for future remote API integration */
  readonly baseUrl: string;

  constructor(config: DashboardConfig) {
    this.storage = config.storage;
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? "https://api.valeo.money/v1";
  }

  /** Query spend data with flexible filters */
  async getSpend(query: SpendQuery): Promise<SpendReport> {
    const records = await this.getFilteredRecords(query);

    let totalRaw = 0n;
    const byAgent: Record<string, { spend: string; count: number }> = {};
    const byEndpoint: Record<string, { spend: string; count: number }> = {};

    for (const r of records) {
      const raw = parseUSDC(r.amount);
      totalRaw += raw;

      const agentEntry = byAgent[r.agent_id] ?? { spend: "0.00", count: 0 };
      agentEntry.spend = formatUSDCHuman(parseUSDC(agentEntry.spend) + raw);
      agentEntry.count++;
      byAgent[r.agent_id] = agentEntry;

      const epEntry = byEndpoint[r.endpoint] ?? { spend: "0.00", count: 0 };
      epEntry.spend = formatUSDCHuman(parseUSDC(epEntry.spend) + raw);
      epEntry.count++;
      byEndpoint[r.endpoint] = epEntry;
    }

    return {
      totalSpend: formatUSDCHuman(totalRaw),
      count: records.length,
      byAgent,
      byEndpoint,
    };
  }

  /** Get summary info for all known agents */
  async getAgents(): Promise<AgentSummary[]> {
    const allRecords = await this.storage.query({});
    const agentMap = new Map<
      string,
      { team: string | null; raw: bigint; count: number; lastActive: number }
    >();

    for (const r of allRecords) {
      const entry = agentMap.get(r.agent_id) ?? {
        team: r.team,
        raw: 0n,
        count: 0,
        lastActive: 0,
      };
      entry.raw += parseUSDC(r.amount);
      entry.count++;
      if (r.created_at > entry.lastActive) entry.lastActive = r.created_at;
      agentMap.set(r.agent_id, entry);
    }

    return [...agentMap.entries()].map(([agentId, data]) => ({
      agentId,
      team: data.team,
      totalSpend: formatUSDCHuman(data.raw),
      transactionCount: data.count,
      lastActive: data.lastActive,
    }));
  }

  /** Get all violations and anomalies as alerts */
  async getAlerts(): Promise<Alert[]> {
    const allRecords = await this.storage.query({});
    const alerts: Alert[] = [];

    for (const r of allRecords) {
      if (r.policy_evaluation === "blocked") {
        alerts.push({
          type: "violation",
          record: r,
          message: `Budget violation by ${r.agent_id} on ${r.endpoint}: $${r.amount}`,
        });
      } else if (r.policy_evaluation === "flagged") {
        alerts.push({
          type: "anomaly",
          record: r,
          message: `Anomaly detected for ${r.agent_id} on ${r.endpoint}: $${r.amount}`,
        });
      }
    }

    return alerts;
  }

  /** Stub: Sync local records to remote API (future api.valeo.money) */
  async sync(): Promise<{ synced: number }> {
    // Future implementation: POST local records to remote API
    console.warn("[sentinel] Dashboard sync is not yet implemented — records remain local only");
    return { synced: 0 };
  }

  /** Stub: Export audit data as PDF via remote API */
  async exportPDF(_query: AuditQuery): Promise<Buffer> {
    throw new Error("PDF export requires the Valeo hosted dashboard (api.valeo.money) — coming soon");
  }

  private async getFilteredRecords(query: SpendQuery): Promise<AuditRecord[]> {
    if (query.agentId) {
      const result = await spendByAgent(this.storage, query.agentId, query.range);
      return result.records;
    }
    if (query.team) {
      const result = await spendByTeam(this.storage, query.team, query.range);
      return result.records;
    }
    if (query.endpoint) {
      const result = await spendByEndpoint(this.storage, query.endpoint, query.range);
      return result.records;
    }
    // No filter — get all in time range
    const result = await spendByEndpoint(this.storage, "", query.range);
    return result.records;
  }
}

export {
  spendByAgent,
  spendByTeam,
  spendByEndpoint,
  topSpenders,
  violations,
  anomalies,
  type TimeRange,
  type SpendResult,
} from "./queries";
