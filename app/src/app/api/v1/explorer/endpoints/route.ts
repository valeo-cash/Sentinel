import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { payments } from "@/db/schema";
import { sql, count, gte, lte, and, eq } from "drizzle-orm";

export const revalidate = 60;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const from = params.get("from") ?? undefined;
  const to = params.get("to") ?? undefined;
  const network = params.get("network") ?? undefined;
  const sort = params.get("sort") ?? "volume";
  const order = params.get("order") ?? "desc";
  const limit = Math.min(Number(params.get("limit") ?? 20), 100);
  const offset = Number(params.get("offset") ?? 0);

  const conditions = [];
  if (from) conditions.push(gte(payments.timestamp, from));
  if (to) conditions.push(lte(payments.timestamp, to));
  if (network) conditions.push(eq(payments.network, network));
  const where = conditions.length ? and(...conditions) : undefined;

  const orderExpr =
    sort === "calls"
      ? sql`COUNT(*)`
      : sort === "latency"
        ? sql`AVG(${payments.responseTimeMs})`
        : sql`SUM(${payments.amountUsd})`;
  const dir = order === "asc" ? sql`ASC` : sql`DESC`;

  const rows = await db
    .select({
      endpointDomain: payments.endpointDomain,
      calls: count(),
      volume: sql<number>`COALESCE(SUM(${payments.amountUsd}), 0)`,
      avgPrice: sql<number>`COALESCE(AVG(${payments.amountUsd}), 0)`,
      avgLatency: sql<number>`COALESCE(AVG(${payments.responseTimeMs}), 0)`,
      successCount: sql<number>`SUM(CASE WHEN ${payments.status} = 'paid' THEN 1 ELSE 0 END)`,
      firstSeen: sql<string>`MIN(${payments.timestamp})`,
      lastSeen: sql<string>`MAX(${payments.timestamp})`,
    })
    .from(payments)
    .where(where)
    .groupBy(payments.endpointDomain)
    .orderBy(sql`${orderExpr} ${dir}`)
    .limit(limit)
    .offset(offset);

  const networksByEndpoint = await db
    .select({
      endpointDomain: payments.endpointDomain,
      network: payments.network,
    })
    .from(payments)
    .where(where)
    .groupBy(payments.endpointDomain, payments.network);

  const networkMap = new Map<string, string[]>();
  for (const r of networksByEndpoint) {
    const arr = networkMap.get(r.endpointDomain) ?? [];
    if (r.network && !arr.includes(r.network)) arr.push(r.network);
    networkMap.set(r.endpointDomain, arr);
  }

  const data = rows.map((r) => {
    const total = Number(r.calls);
    const success = Number(r.successCount);
    const uptime = total > 0 ? Math.round((success / total) * 100) : 0;
    const now = Date.now();
    const lastSeen = r.lastSeen ? new Date(String(r.lastSeen)).getTime() : 0;
    const hoursSinceLastSeen = (now - lastSeen) / (1000 * 60 * 60);
    const status = hoursSinceLastSeen > 72 ? "down" : uptime < 80 ? "degraded" : "healthy";

    return {
      endpointDomain: r.endpointDomain,
      calls: total,
      volume: Number(r.volume).toFixed(2),
      avgPrice: Number(r.avgPrice).toFixed(4),
      avgLatency: Math.round(Number(r.avgLatency)),
      uptime,
      status,
      networks: networkMap.get(r.endpointDomain) ?? [],
      firstSeen: String(r.firstSeen ?? ""),
      lastSeen: String(r.lastSeen ?? ""),
    };
  });

  return NextResponse.json(
    { data },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } }
  );
}
