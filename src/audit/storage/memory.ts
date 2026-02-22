import type { AuditRecord, AuditQuery, AuditSummary } from "../../types/audit";
import type { StorageBackend } from "./interface";
import { parseUSDC, formatUSDC, formatUSDCHuman, compareUSDC } from "../../utils/money";

/** In-memory audit storage with configurable capacity and FIFO eviction */
export class MemoryStorage implements StorageBackend {
  private readonly records = new Map<string, AuditRecord>();
  private readonly insertOrder: string[] = [];
  private readonly maxRecords: number;

  constructor(maxRecords = 10_000) {
    this.maxRecords = maxRecords;
  }

  async write(record: AuditRecord): Promise<void> {
    if (this.records.size >= this.maxRecords) {
      const oldest = this.insertOrder.shift();
      if (oldest) this.records.delete(oldest);
    }
    this.records.set(record.id, record);
    this.insertOrder.push(record.id);
  }

  async query(query: AuditQuery): Promise<AuditRecord[]> {
    let results = this.filter(query);
    results = this.sort(results, query.orderBy, query.order);
    const offset = query.offset ?? 0;
    const limit = query.limit ?? results.length;
    return results.slice(offset, offset + limit);
  }

  async summarize(query: Partial<AuditQuery>): Promise<AuditSummary> {
    const records = this.filter(query);
    return buildSummary(records, query);
  }

  async count(query: Partial<AuditQuery>): Promise<number> {
    return this.filter(query).length;
  }

  async getById(id: string): Promise<AuditRecord | null> {
    return this.records.get(id) ?? null;
  }

  private filter(query: Partial<AuditQuery>): AuditRecord[] {
    return [...this.records.values()].filter((r) => matchesQuery(r, query));
  }

  private sort(
    records: AuditRecord[],
    orderBy?: AuditQuery["orderBy"],
    order?: AuditQuery["order"],
  ): AuditRecord[] {
    if (!orderBy) return records;
    const dir = order === "desc" ? -1 : 1;
    return records.sort((a, b) => {
      switch (orderBy) {
        case "created_at":
          return (a.created_at - b.created_at) * dir;
        case "amount":
          return compareUSDC(a.amount, b.amount) * dir;
        case "endpoint":
          return a.endpoint.localeCompare(b.endpoint) * dir;
        default:
          return 0;
      }
    });
  }
}

/** Shared filter logic reusable across storage backends */
export function matchesQuery(
  record: AuditRecord,
  query: Partial<AuditQuery>,
): boolean {
  if (query.agentId && record.agent_id !== query.agentId) return false;
  if (query.team && record.team !== query.team) return false;
  if (query.endpoint && !record.endpoint.includes(query.endpoint)) return false;
  if (query.minAmount && compareUSDC(record.amount, query.minAmount) < 0) return false;
  if (query.maxAmount && compareUSDC(record.amount, query.maxAmount) > 0) return false;
  if (query.startTime && record.created_at < query.startTime) return false;
  if (query.endTime && record.created_at > query.endTime) return false;
  if (query.status?.length && !query.status.includes(record.policy_evaluation)) return false;
  if (query.tags?.length && !query.tags.some((t) => record.tags.includes(t))) return false;
  return true;
}

/** Build an AuditSummary from a set of records */
export function buildSummary(
  records: AuditRecord[],
  query: Partial<AuditQuery>,
): AuditSummary {
  let totalRaw = 0n;
  let maxRaw = 0n;
  const agents = new Set<string>();
  const endpoints = new Set<string>();
  const byAgent: Record<string, { spend: string; count: number }> = {};
  const byEndpoint: Record<string, { spend: string; count: number }> = {};
  const byTeam: Record<string, { spend: string; count: number }> = {};
  let violations = 0;
  let minTs = Infinity;
  let maxTs = 0;

  for (const r of records) {
    const raw = parseUSDC(r.amount);
    totalRaw += raw;
    if (raw > maxRaw) maxRaw = raw;
    agents.add(r.agent_id);
    endpoints.add(r.endpoint);

    if (r.created_at < minTs) minTs = r.created_at;
    if (r.created_at > maxTs) maxTs = r.created_at;

    if (r.policy_evaluation === "blocked") violations++;

    // by_agent
    const agentEntry = byAgent[r.agent_id] ?? { spend: "0.000000", count: 0 };
    agentEntry.spend = formatUSDC(parseUSDC(agentEntry.spend) + raw);
    agentEntry.count++;
    byAgent[r.agent_id] = agentEntry;

    // by_endpoint
    const epEntry = byEndpoint[r.endpoint] ?? { spend: "0.000000", count: 0 };
    epEntry.spend = formatUSDC(parseUSDC(epEntry.spend) + raw);
    epEntry.count++;
    byEndpoint[r.endpoint] = epEntry;

    // by_team
    const teamKey = r.team ?? "(none)";
    const teamEntry = byTeam[teamKey] ?? { spend: "0.000000", count: 0 };
    teamEntry.spend = formatUSDC(parseUSDC(teamEntry.spend) + raw);
    teamEntry.count++;
    byTeam[teamKey] = teamEntry;
  }

  const count = records.length;
  return {
    total_spend: formatUSDCHuman(totalRaw),
    total_transactions: count,
    unique_endpoints: endpoints.size,
    unique_agents: agents.size,
    avg_payment: count > 0 ? formatUSDCHuman(totalRaw / BigInt(count)) : "0.00",
    max_payment: formatUSDCHuman(maxRaw),
    by_agent: byAgent,
    by_endpoint: byEndpoint,
    by_team: byTeam,
    violations,
    period: {
      start: query.startTime ?? (minTs === Infinity ? 0 : minTs),
      end: query.endTime ?? (maxTs === 0 ? 0 : maxTs),
    },
  };
}
