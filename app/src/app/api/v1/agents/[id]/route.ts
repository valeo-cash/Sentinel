import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/server/auth";
import { db } from "@/db/client";
import { agents, payments } from "@/db/schema";
import { eq, and, count, sql } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [agent] = await db
    .select()
    .from(agents)
    .where(and(eq(agents.id, id), eq(agents.teamId, auth.team.id)))
    .limit(1);

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const [stats] = await db
    .select({
      payment_count: count(),
      total_spend: sql<number>`COALESCE(SUM(${payments.amountUsd}), 0)`,
    })
    .from(payments)
    .where(and(eq(payments.agentId, id), eq(payments.teamId, auth.team.id)));

  return NextResponse.json({
    ...agent,
    payment_count: Number(stats?.payment_count ?? 0),
    total_spend: Number(stats?.total_spend ?? 0),
  });
}
