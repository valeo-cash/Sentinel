import type { AuditRecord } from "../types/audit";
import type { StorageBackend } from "../audit/storage/interface";
import { resolveTimeRange } from "../utils/time";
import { parseUSDC, formatUSDCHuman } from "../utils/money";

export type TimeRange =
  | "last_hour"
  | "last_day"
  | "last_week"
  | "last_month"
  | { start: number; end: number };

export interface SpendResult {
  spend: string;
  count: number;
  records: AuditRecord[];
}

/** Query spend for a specific agent within a time range */
export async function spendByAgent(
  storage: StorageBackend,
  agentId: string,
  range: TimeRange,
): Promise<SpendResult> {
  const { start, end } = resolveTimeRange(range);
  const records = await storage.query({ agentId, startTime: start, endTime: end });
  return aggregateSpend(records);
}

/** Query spend for a team within a time range */
export async function spendByTeam(
  storage: StorageBackend,
  team: string,
  range: TimeRange,
): Promise<SpendResult> {
  const { start, end } = resolveTimeRange(range);
  const records = await storage.query({ team, startTime: start, endTime: end });
  return aggregateSpend(records);
}

/** Query spend for an endpoint pattern within a time range */
export async function spendByEndpoint(
  storage: StorageBackend,
  pattern: string,
  range: TimeRange,
): Promise<SpendResult> {
  const { start, end } = resolveTimeRange(range);
  const records = await storage.query({ endpoint: pattern, startTime: start, endTime: end });
  return aggregateSpend(records);
}

/** Get top spending agents within a time range */
export async function topSpenders(
  storage: StorageBackend,
  limit: number,
  range: TimeRange,
): Promise<Array<{ agentId: string; spend: string; count: number }>> {
  const { start, end } = resolveTimeRange(range);
  const records = await storage.query({ startTime: start, endTime: end });

  const byAgent = new Map<string, { raw: bigint; count: number }>();
  for (const r of records) {
    const entry = byAgent.get(r.agent_id) ?? { raw: 0n, count: 0 };
    entry.raw += parseUSDC(r.amount);
    entry.count++;
    byAgent.set(r.agent_id, entry);
  }

  return [...byAgent.entries()]
    .map(([agentId, data]) => ({
      agentId,
      spend: formatUSDCHuman(data.raw),
      count: data.count,
    }))
    .sort((a, b) => {
      const aRaw = parseUSDC(a.spend);
      const bRaw = parseUSDC(b.spend);
      return aRaw > bRaw ? -1 : aRaw < bRaw ? 1 : 0;
    })
    .slice(0, limit);
}

/** Get all blocked (violation) records within a time range */
export async function violations(
  storage: StorageBackend,
  range: TimeRange,
): Promise<AuditRecord[]> {
  const { start, end } = resolveTimeRange(range);
  return storage.query({ status: ["blocked"], startTime: start, endTime: end });
}

/** Get all flagged (anomaly) records within a time range */
export async function anomalies(
  storage: StorageBackend,
  range: TimeRange,
): Promise<AuditRecord[]> {
  const { start, end } = resolveTimeRange(range);
  return storage.query({ status: ["flagged"], startTime: start, endTime: end });
}

function aggregateSpend(records: AuditRecord[]): SpendResult {
  let totalRaw = 0n;
  for (const r of records) {
    totalRaw += parseUSDC(r.amount);
  }
  return {
    spend: formatUSDCHuman(totalRaw),
    count: records.length,
    records,
  };
}
