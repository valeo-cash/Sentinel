import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { payments, agents } from "@/db/schema";
import { sql, count, eq, desc } from "drizzle-orm";

export const revalidate = 60;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ domain: string }> }
) {
  const { domain } = await params;
  const decodedDomain = decodeURIComponent(domain);

  const [agg] = await db
    .select({
      calls: count(),
      volume: sql<number>`COALESCE(SUM(${payments.amountUsd}), 0)`,
      avgPrice: sql<number>`COALESCE(AVG(${payments.amountUsd}), 0)`,
      avgLatency: sql<number>`COALESCE(AVG(${payments.responseTimeMs}), 0)`,
      successCount: sql<number>`SUM(CASE WHEN ${payments.status} = 'paid' THEN 1 ELSE 0 END)`,
      firstSeen: sql<string>`MIN(${payments.timestamp})`,
      lastSeen: sql<string>`MAX(${payments.timestamp})`,
    })
    .from(payments)
    .where(eq(payments.endpointDomain, decodedDomain));

  if (!agg || Number(agg.calls) === 0) {
    return NextResponse.json({ error: "Endpoint not found" }, { status: 404 });
  }

  const total = Number(agg.calls);
  const success = Number(agg.successCount);
  const uptime = total > 0 ? Math.round((success / total) * 100) : 0;

  const networkRows = await db
    .select({ network: payments.network })
    .from(payments)
    .where(eq(payments.endpointDomain, decodedDomain))
    .groupBy(payments.network);

  const bucketExpr = sql`strftime('%Y-%m-%d', datetime(${payments.timestamp}))`;
  const chartRows = await db
    .select({
      date: bucketExpr,
      volume: sql<number>`COALESCE(SUM(${payments.amountUsd}), 0)`,
      transactions: count(),
      avgLatency: sql<number>`COALESCE(AVG(${payments.responseTimeMs}), 0)`,
      successRate: sql<number>`ROUND(CAST(SUM(CASE WHEN ${payments.status} = 'paid' THEN 1 ELSE 0 END) AS REAL) / COUNT(*) * 100)`,
    })
    .from(payments)
    .where(eq(payments.endpointDomain, decodedDomain))
    .groupBy(bucketExpr)
    .orderBy(bucketExpr);

  const recentPayments = await db
    .select({
      id: payments.id,
      agentId: payments.agentId,
      amountUsd: payments.amountUsd,
      network: payments.network,
      txHash: payments.txHash,
      status: payments.status,
      responseTimeMs: payments.responseTimeMs,
      timestamp: payments.timestamp,
      agentExternalId: agents.externalId,
    })
    .from(payments)
    .innerJoin(agents, eq(payments.agentId, agents.id))
    .where(eq(payments.endpointDomain, decodedDomain))
    .orderBy(desc(payments.createdAt))
    .limit(50);

  const agentRows = await db
    .select({
      agentId: payments.agentId,
      agentExternalId: agents.externalId,
      agentName: agents.name,
      totalSpent: sql<number>`COALESCE(SUM(${payments.amountUsd}), 0)`,
      callCount: count(),
    })
    .from(payments)
    .innerJoin(agents, eq(payments.agentId, agents.id))
    .where(eq(payments.endpointDomain, decodedDomain))
    .groupBy(payments.agentId)
    .orderBy(sql`SUM(${payments.amountUsd}) DESC`);

  return NextResponse.json(
    {
      endpointDomain: decodedDomain,
      calls: total,
      volume: Number(agg.volume).toFixed(2),
      avgPrice: Number(agg.avgPrice).toFixed(4),
      avgLatency: Math.round(Number(agg.avgLatency)),
      uptime,
      networks: networkRows.map((r) => r.network).filter(Boolean),
      firstSeen: String(agg.firstSeen ?? ""),
      lastSeen: String(agg.lastSeen ?? ""),
      chart: chartRows.map((r) => ({
        date: String(r.date),
        volume: Number(r.volume).toFixed(2),
        transactions: Number(r.transactions),
        avgLatency: Math.round(Number(r.avgLatency)),
        successRate: Number(r.successRate),
      })),
      recentPayments: recentPayments.map((r) => ({
        id: r.id,
        agentExternalId: r.agentExternalId,
        amountUsd: r.amountUsd,
        network: r.network,
        txHash: r.txHash,
        status: r.status,
        responseTimeMs: r.responseTimeMs,
        timestamp: r.timestamp,
      })),
      agents: agentRows.map((r) => ({
        agentExternalId: r.agentExternalId,
        agentName: r.agentName,
        totalSpent: Number(r.totalSpent).toFixed(2),
        callCount: Number(r.callCount),
      })),
    },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } }
  );
}
