import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/server/auth";
import { db } from "@/db/client";
import { teams, payments, receipts, agents, alerts } from "@/db/schema";
import { eq, and, count } from "drizzle-orm";
import { randomUUID } from "node:crypto";

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { agentId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { agentId } = body;
  if (!agentId) {
    return NextResponse.json(
      { error: "agentId is required" },
      { status: 400 }
    );
  }

  const targetTeamId = auth.team.id;

  // 1. Already exists under the user's team — idempotent success
  const [existing] = await db
    .select()
    .from(agents)
    .where(and(eq(agents.teamId, targetTeamId), eq(agents.externalId, agentId)))
    .limit(1);

  if (existing) {
    return NextResponse.json({ success: true, agentId });
  }

  // 2. Exists under an anonymous team — migrate all data
  const [anonAgent] = await db
    .select({ id: agents.id, teamId: agents.teamId })
    .from(agents)
    .innerJoin(teams, eq(teams.id, agents.teamId))
    .where(and(eq(agents.externalId, agentId), eq(teams.plan, "anonymous")))
    .limit(1);

  if (anonAgent) {
    const anonTeamId = anonAgent.teamId;

    const [[paymentCount], [receiptCount], [agentCount]] = await Promise.all([
      db.select({ count: count() }).from(payments).where(eq(payments.teamId, anonTeamId)),
      db.select({ count: count() }).from(receipts).where(eq(receipts.teamId, anonTeamId)),
      db.select({ count: count() }).from(agents).where(eq(agents.teamId, anonTeamId)),
    ]);

    await Promise.all([
      db.update(payments).set({ teamId: targetTeamId }).where(eq(payments.teamId, anonTeamId)),
      db.update(receipts).set({ teamId: targetTeamId }).where(eq(receipts.teamId, anonTeamId)),
      db.update(agents).set({ teamId: targetTeamId }).where(eq(agents.teamId, anonTeamId)),
      db.update(alerts).set({ teamId: targetTeamId }).where(eq(alerts.teamId, anonTeamId)),
    ]);

    await db.delete(teams).where(eq(teams.id, anonTeamId));

    return NextResponse.json({
      success: true,
      agentId,
      migrated: {
        payments: paymentCount?.count ?? 0,
        receipts: receiptCount?.count ?? 0,
        agents: agentCount?.count ?? 0,
      },
    });
  }

  // 3. No agent exists anywhere — create a new one
  const now = new Date();
  await db.insert(agents).values({
    id: randomUUID(),
    teamId: targetTeamId,
    externalId: agentId,
    name: agentId,
    firstSeenAt: now,
    lastSeenAt: now,
  });

  return NextResponse.json({ success: true, agentId });
}
