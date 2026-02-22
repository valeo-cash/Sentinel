import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { payments } from "@/db/schema";
import { sql, count, gte, lte, and } from "drizzle-orm";

export const revalidate = 60;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const from = params.get("from") ?? undefined;
  const to = params.get("to") ?? undefined;

  const conditions = [];
  if (from) conditions.push(gte(payments.timestamp, from));
  if (to) conditions.push(lte(payments.timestamp, to));
  const where = conditions.length ? and(...conditions) : undefined;

  const [agg] = await db
    .select({
      totalVolume: sql<number>`COALESCE(SUM(${payments.amountUsd}), 0)`,
      totalTransactions: count(),
      totalEndpoints: sql<number>`COUNT(DISTINCT ${payments.endpointDomain})`,
      activeAgents: sql<number>`COUNT(DISTINCT ${payments.agentId})`,
      totalSuccessful: sql<number>`SUM(CASE WHEN ${payments.status} = 'paid' THEN 1 ELSE 0 END)`,
      totalFailed: sql<number>`SUM(CASE WHEN ${payments.status} = 'failed' THEN 1 ELSE 0 END)`,
    })
    .from(payments)
    .where(where);

  const networkRows = await db
    .select({
      network: payments.network,
      transactions: count(),
      volume: sql<number>`COALESCE(SUM(${payments.amountUsd}), 0)`,
    })
    .from(payments)
    .where(where)
    .groupBy(payments.network)
    .orderBy(sql`COUNT(*) DESC`);

  const totalTxns = Number(agg?.totalTransactions ?? 0);
  const networks = networkRows.map((r) => ({
    chain: r.network ?? "unknown",
    transactions: Number(r.transactions),
    volume: Number(r.volume).toFixed(2),
    percentage: totalTxns > 0 ? Math.round((Number(r.transactions) / totalTxns) * 100) : 0,
  }));

  const bucketExpr = sql`strftime('%Y-%m-%d', datetime(${payments.timestamp}))`;
  const chartRows = await db
    .select({
      date: bucketExpr,
      volume: sql<number>`COALESCE(SUM(${payments.amountUsd}), 0)`,
      transactions: count(),
    })
    .from(payments)
    .where(where)
    .groupBy(bucketExpr)
    .orderBy(bucketExpr);

  const volumeChart = chartRows.map((r) => ({
    date: String(r.date),
    volume: Number(r.volume).toFixed(2),
    transactions: Number(r.transactions),
  }));

  const categoryRows = await db
    .select({
      category: payments.category,
      count: count(),
      volume: sql<number>`COALESCE(SUM(${payments.amountUsd}), 0)`,
    })
    .from(payments)
    .where(where)
    .groupBy(payments.category)
    .orderBy(sql`SUM(${payments.amountUsd}) DESC`);

  const categories = categoryRows.map((r) => ({
    category: r.category ?? "uncategorized",
    count: Number(r.count),
    volume: Number(r.volume).toFixed(2),
  }));

  return NextResponse.json(
    {
      totalVolume: Number(agg?.totalVolume ?? 0).toFixed(2),
      totalTransactions: Number(agg?.totalTransactions ?? 0),
      totalEndpoints: Number(agg?.totalEndpoints ?? 0),
      activeAgents: Number(agg?.activeAgents ?? 0),
      totalSuccessful: Number(agg?.totalSuccessful ?? 0),
      totalFailed: Number(agg?.totalFailed ?? 0),
      networks,
      volumeChart,
      categories,
    },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } }
  );
}
