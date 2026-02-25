import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { payments, agents } from "@/db/schema";
import { eq, sql, count, desc } from "drizzle-orm";

export const revalidate = 30;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params;

  const [agent] = await db
    .select({
      externalId: agents.externalId,
      name: agents.name,
      firstSeenAt: agents.firstSeenAt,
      lastSeenAt: agents.lastSeenAt,
    })
    .from(agents)
    .where(eq(agents.externalId, agentId))
    .limit(1);

  const [agg] = await db
    .select({
      totalPayments: count(),
      totalSpent: sql<number>`COALESCE(SUM(${payments.amountUsd}), 0)`,
      lastActive: sql<string>`MAX(${payments.timestamp})`,
    })
    .from(payments)
    .where(eq(payments.agentId, agent?.externalId ?? agentId));

  const recentPayments = await db
    .select({
      id: payments.id,
      endpoint: payments.endpointDomain,
      amount: payments.amount,
      amountUsd: payments.amountUsd,
      asset: payments.asset,
      network: payments.network,
      status: payments.status,
      txHash: payments.txHash,
      timestamp: payments.timestamp,
    })
    .from(payments)
    .where(eq(payments.agentId, agent?.externalId ?? agentId))
    .orderBy(desc(payments.createdAt))
    .limit(20);

  if (!agent && recentPayments.length === 0) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      agentId: agent?.externalId ?? agentId,
      name: agent?.name ?? null,
      firstSeenAt: agent?.firstSeenAt ?? null,
      lastSeenAt: agent?.lastSeenAt ?? null,
      totalPayments: Number(agg?.totalPayments ?? 0),
      totalSpent: Number(agg?.totalSpent ?? 0).toFixed(2),
      lastActive: agg?.lastActive ?? null,
      recentPayments: recentPayments.map((p) => ({
        id: p.id,
        endpoint: p.endpoint,
        amount: p.amount,
        amountUsd: p.amountUsd,
        asset: p.asset,
        network: p.network,
        status: p.status,
        txHash: p.txHash,
        timestamp: p.timestamp,
      })),
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    }
  );
}
