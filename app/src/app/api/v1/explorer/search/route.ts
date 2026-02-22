import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { payments, agents } from "@/db/schema";
import { sql, like, eq, count } from "drizzle-orm";

export const revalidate = 60;

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ endpoints: [], agents: [], transactions: [] });
  }

  const pattern = `%${q}%`;

  const endpointRows = await db
    .select({
      endpointDomain: payments.endpointDomain,
      calls: count(),
      volume: sql<number>`COALESCE(SUM(${payments.amountUsd}), 0)`,
    })
    .from(payments)
    .where(like(payments.endpointDomain, pattern))
    .groupBy(payments.endpointDomain)
    .orderBy(sql`COUNT(*) DESC`)
    .limit(10);

  const agentRows = await db
    .select({
      externalId: agents.externalId,
      name: agents.name,
      id: agents.id,
    })
    .from(agents)
    .where(like(agents.externalId, pattern))
    .limit(10);

  const txRows = await db
    .select({
      id: payments.id,
      txHash: payments.txHash,
      amountUsd: payments.amountUsd,
      endpointDomain: payments.endpointDomain,
      status: payments.status,
      timestamp: payments.timestamp,
    })
    .from(payments)
    .where(like(payments.txHash, pattern))
    .orderBy(sql`${payments.createdAt} DESC`)
    .limit(10);

  return NextResponse.json(
    {
      endpoints: endpointRows.map((r) => ({
        endpointDomain: r.endpointDomain,
        calls: Number(r.calls),
        volume: Number(r.volume).toFixed(2),
      })),
      agents: agentRows.map((r) => ({
        externalId: r.externalId,
        name: r.name,
      })),
      transactions: txRows.map((r) => ({
        id: r.id,
        txHash: r.txHash,
        amountUsd: r.amountUsd,
        endpointDomain: r.endpointDomain,
        status: r.status,
        timestamp: r.timestamp,
      })),
    },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } }
  );
}
