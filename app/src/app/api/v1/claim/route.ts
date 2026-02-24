import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/server/auth";
import { db } from "@/db/client";
import { teams, payments, receipts, agents, alerts } from "@/db/schema";
import { eq, sql, count } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { claimToken?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { claimToken } = body;
  if (!claimToken) {
    return NextResponse.json(
      { error: "claimToken is required" },
      { status: 400 },
    );
  }

  const [anonTeam] = await db
    .select()
    .from(teams)
    .where(eq(teams.claimToken, claimToken))
    .limit(1);

  if (!anonTeam) {
    return NextResponse.json(
      { error: "Invalid or already claimed token" },
      { status: 404 },
    );
  }

  if (anonTeam.plan !== "anonymous") {
    return NextResponse.json(
      { error: "Token does not belong to an anonymous team" },
      { status: 400 },
    );
  }

  const targetTeamId = auth.team.id;
  const anonTeamId = anonTeam.id;

  // Count what we're migrating
  const [[paymentCount], [agentCount], [receiptCount]] = await Promise.all([
    db.select({ count: count() }).from(payments).where(eq(payments.teamId, anonTeamId)),
    db.select({ count: count() }).from(agents).where(eq(agents.teamId, anonTeamId)),
    db.select({ count: count() }).from(receipts).where(eq(receipts.teamId, anonTeamId)),
  ]);

  // Move all data to the real team
  await Promise.all([
    db.update(payments).set({ teamId: targetTeamId }).where(eq(payments.teamId, anonTeamId)),
    db.update(agents).set({ teamId: targetTeamId }).where(eq(agents.teamId, anonTeamId)),
    db.update(receipts).set({ teamId: targetTeamId }).where(eq(receipts.teamId, anonTeamId)),
    db.update(alerts).set({ teamId: targetTeamId }).where(eq(alerts.teamId, anonTeamId)),
  ]);

  // Delete the anonymous team
  await db.delete(teams).where(eq(teams.id, anonTeamId));

  return NextResponse.json({
    success: true,
    migrated: {
      payments: paymentCount?.count ?? 0,
      agents: agentCount?.count ?? 0,
      receipts: receiptCount?.count ?? 0,
    },
  });
}
