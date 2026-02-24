import { db } from "@/db/client";
import { payments, agents } from "@/db/schema";
import { eq, and, gte, lte, sql, desc, count } from "drizzle-orm";

export type TimeRange = {
  from?: string;
  to?: string;
};

export type SummaryResult = {
  total_spent_usd: number;
  total_payments: number;
  total_failed: number;
  total_blocked: number;
  active_agents: number;
  unique_endpoints: number;
  avg_payment_usd: number;
  max_payment_usd: number;
  period_change: {
    total_spent_pct: number;
    total_payments_pct: number;
    total_failed_pct: number;
    total_blocked_pct: number;
  };
};

function buildTimeConditions(
  teamId: string,
  range?: TimeRange
): ReturnType<typeof and> | undefined {
  const conditions = [eq(payments.teamId, teamId)];
  if (range?.from) {
    conditions.push(gte(payments.timestamp, range.from));
  }
  if (range?.to) {
    conditions.push(lte(payments.timestamp, range.to));
  }
  return conditions.length > 1 ? and(...conditions) : eq(payments.teamId, teamId);
}

function computePeriodRange(range?: TimeRange): {
  from?: string;
  to?: string;
} | null {
  if (!range?.from || !range?.to) return null;
  const fromDate = new Date(range.from);
  const toDate = new Date(range.to);
  const diffMs = toDate.getTime() - fromDate.getTime();
  const prevToDate = new Date(fromDate.getTime() - 1);
  const prevFromDate = new Date(prevToDate.getTime() - diffMs);
  return {
    from: prevFromDate.toISOString(),
    to: prevToDate.toISOString(),
  };
}

/**
 * Returns summary stats for the period plus period_change (pct diffs vs previous equal-length period).
 */
export async function getSummary(
  teamId: string,
  range?: TimeRange
): Promise<SummaryResult> {
  const where = buildTimeConditions(teamId, range);

  const [agg] = await db
    .select({
      total_spent_usd: sql<number>`COALESCE(SUM(${payments.amountUsd}), 0)`,
      total_payments: count(),
      total_failed: sql<number>`SUM(CASE WHEN ${payments.status} = 'failed' THEN 1 ELSE 0 END)`,
      total_blocked: sql<number>`SUM(CASE WHEN ${payments.status} = 'blocked' THEN 1 ELSE 0 END)`,
      active_agents: sql<number>`COUNT(DISTINCT ${payments.agentId})`,
      unique_endpoints: sql<number>`COUNT(DISTINCT ${payments.endpointDomain})`,
      avg_payment_usd: sql<number>`COALESCE(AVG(${payments.amountUsd}), 0)`,
      max_payment_usd: sql<number>`COALESCE(MAX(${payments.amountUsd}), 0)`,
    })
    .from(payments)
    .where(where);

  if (!agg) {
    return {
      total_spent_usd: 0,
      total_payments: 0,
      total_failed: 0,
      total_blocked: 0,
      active_agents: 0,
      unique_endpoints: 0,
      avg_payment_usd: 0,
      max_payment_usd: 0,
      period_change: {
        total_spent_pct: 0,
        total_payments_pct: 0,
        total_failed_pct: 0,
        total_blocked_pct: 0,
      },
    };
  }

  const prevRange = computePeriodRange(range);
  let periodChange = {
    total_spent_pct: 0,
    total_payments_pct: 0,
    total_failed_pct: 0,
    total_blocked_pct: 0,
  };

  if (prevRange) {
    const prevWhere = buildTimeConditions(teamId, prevRange);
    const [prevAgg] = await db
      .select({
        total_spent_usd: sql<number>`COALESCE(SUM(${payments.amountUsd}), 0)`,
        total_payments: count(),
        total_failed: sql<number>`SUM(CASE WHEN ${payments.status} = 'failed' THEN 1 ELSE 0 END)`,
        total_blocked: sql<number>`SUM(CASE WHEN ${payments.status} = 'blocked' THEN 1 ELSE 0 END)`,
      })
      .from(payments)
      .where(prevWhere);

    if (prevAgg) {
      const pct = (curr: number, prev: number) =>
        prev === 0 ? (curr > 0 ? 100 : 0) : ((curr - prev) / prev) * 100;
      periodChange = {
        total_spent_pct: pct(Number(agg.total_spent_usd), Number(prevAgg.total_spent_usd)),
        total_payments_pct: pct(Number(agg.total_payments), Number(prevAgg.total_payments)),
        total_failed_pct: pct(Number(agg.total_failed), Number(prevAgg.total_failed)),
        total_blocked_pct: pct(Number(agg.total_blocked), Number(prevAgg.total_blocked)),
      };
    }
  }

  return {
    total_spent_usd: Number(agg.total_spent_usd),
    total_payments: Number(agg.total_payments),
    total_failed: Number(agg.total_failed),
    total_blocked: Number(agg.total_blocked),
    active_agents: Number(agg.active_agents),
    unique_endpoints: Number(agg.unique_endpoints),
    avg_payment_usd: Number(agg.avg_payment_usd),
    max_payment_usd: Number(agg.max_payment_usd),
    period_change: periodChange,
  };
}

export type TimeseriesBucket = "hour" | "day" | "week";

export type TimeseriesRow = {
  timestamp: string;
  total_usd: number;
  count: number;
  avg_usd: number;
};

/**
 * Returns timeseries data grouped by time bucket using strftime.
 */
export async function getTimeseries(
  teamId: string,
  bucket: TimeseriesBucket,
  range?: TimeRange
): Promise<TimeseriesRow[]> {
  const where = buildTimeConditions(teamId, range);
  const format =
    bucket === "hour"
      ? "%Y-%m-%d %H:00:00"
      : bucket === "day"
        ? "%Y-%m-%d 00:00:00"
        : "%Y-%m-%d 00:00:00"; // week: use day for sqlite simplicity

  const bucketExpr = sql`strftime(${sql.raw(`'${format}'`)}, datetime(${payments.timestamp}))`;

  const rows = await db
    .select({
      timestamp: bucketExpr,
      total_usd: sql<number>`COALESCE(SUM(${payments.amountUsd}), 0)`,
      count: count(),
      avg_usd: sql<number>`COALESCE(AVG(${payments.amountUsd}), 0)`,
    })
    .from(payments)
    .where(where)
    .groupBy(bucketExpr)
    .orderBy(bucketExpr);

  return rows.map((r) => ({
    timestamp: String(r.timestamp),
    total_usd: Number(r.total_usd),
    count: Number(r.count),
    avg_usd: Number(r.avg_usd),
  }));
}

export type ByAgentRow = {
  agent_id: string;
  agent_name: string | null;
  total_usd: number;
  count: number;
};

/**
 * Groups by agent_id, joins agents for name, sums amount_usd, counts, orders by total DESC.
 */
export async function getByAgent(
  teamId: string,
  range?: TimeRange
): Promise<ByAgentRow[]> {
  const where = buildTimeConditions(teamId, range);

  const rows = await db
    .select({
      agent_id: payments.agentId,
      agent_name: agents.name,
      total_usd: sql<number>`COALESCE(SUM(${payments.amountUsd}), 0)`,
      count: count(),
    })
    .from(payments)
    .innerJoin(agents, eq(payments.agentId, agents.id))
    .where(where)
    .groupBy(payments.agentId)
    .orderBy(desc(sql`SUM(${payments.amountUsd})`));

  return rows.map((r) => ({
    agent_id: r.agent_id,
    agent_name: r.agent_name,
    total_usd: Number(r.total_usd),
    count: Number(r.count),
  }));
}

export type ByCategoryRow = {
  category: string | null;
  total_usd: number;
  count: number;
};

/**
 * Groups by category.
 */
export async function getByCategory(
  teamId: string,
  range?: TimeRange
): Promise<ByCategoryRow[]> {
  const where = buildTimeConditions(teamId, range);

  const rows = await db
    .select({
      category: payments.category,
      total_usd: sql<number>`COALESCE(SUM(${payments.amountUsd}), 0)`,
      count: count(),
    })
    .from(payments)
    .where(where)
    .groupBy(payments.category)
    .orderBy(desc(sql`SUM(${payments.amountUsd})`));

  return rows.map((r) => ({
    category: r.category,
    total_usd: Number(r.total_usd),
    count: Number(r.count),
  }));
}

export type ByEndpointRow = {
  endpoint_domain: string;
  total_usd: number;
  count: number;
};

/**
 * Groups by endpoint_domain.
 */
export async function getByEndpoint(
  teamId: string,
  range?: TimeRange
): Promise<ByEndpointRow[]> {
  const where = buildTimeConditions(teamId, range);

  const rows = await db
    .select({
      endpoint_domain: payments.endpointDomain,
      total_usd: sql<number>`COALESCE(SUM(${payments.amountUsd}), 0)`,
      count: count(),
    })
    .from(payments)
    .where(where)
    .groupBy(payments.endpointDomain)
    .orderBy(desc(sql`SUM(${payments.amountUsd})`));

  return rows.map((r) => ({
    endpoint_domain: r.endpoint_domain,
    total_usd: Number(r.total_usd),
    count: Number(r.count),
  }));
}

export type ByNetworkRow = {
  network: string | null;
  total_usd: number;
  count: number;
};

/**
 * Groups by network.
 */
export async function getByNetwork(
  teamId: string,
  range?: TimeRange
): Promise<ByNetworkRow[]> {
  const where = buildTimeConditions(teamId, range);

  const rows = await db
    .select({
      network: payments.network,
      total_usd: sql<number>`COALESCE(SUM(${payments.amountUsd}), 0)`,
      count: count(),
    })
    .from(payments)
    .where(where)
    .groupBy(payments.network)
    .orderBy(desc(sql`SUM(${payments.amountUsd})`));

  return rows.map((r) => ({
    network: r.network,
    total_usd: Number(r.total_usd),
    count: Number(r.count),
  }));
}
