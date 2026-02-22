import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/server/auth";
import { agentCreateSchema } from "@/server/validation";
import { db } from "@/db/client";
import { agents, payments } from "@/db/schema";
import { eq, and, count, sql, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const agentPayments = db
    .select({
      agentId: payments.agentId,
      paymentCount: count().as("payment_count"),
      totalSpend: sql<number>`COALESCE(SUM(${payments.amountUsd}), 0)`.as("total_spend"),
    })
    .from(payments)
    .where(eq(payments.teamId, auth.team.id))
    .groupBy(payments.agentId)
    .as("agent_payments");

  const rows = await db
    .select({
      agent: agents,
      paymentCount: agentPayments.paymentCount,
      totalSpend: agentPayments.totalSpend,
    })
    .from(agents)
    .leftJoin(agentPayments, eq(agents.id, agentPayments.agentId))
    .where(eq(agents.teamId, auth.team.id))
    .orderBy(desc(agents.lastSeenAt));

  const data = rows.map((r) => ({
    ...r.agent,
    payment_count: Number(r.paymentCount ?? 0),
    total_spend: Number(r.totalSpend ?? 0),
  }));

  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = agentCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const now = new Date();
  const id = nanoid();
  await db.insert(agents).values({
    id,
    teamId: auth.team.id,
    externalId: parsed.data.external_id,
    name: parsed.data.name ?? null,
    authorizedBy: parsed.data.authorized_by ?? null,
    firstSeenAt: now,
    lastSeenAt: now,
  });

  const [created] = await db
    .select()
    .from(agents)
    .where(eq(agents.id, id))
    .limit(1);

  return NextResponse.json(created, { status: 201 });
}
