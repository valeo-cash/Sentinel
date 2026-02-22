import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/server/auth";
import { db } from "@/db/client";
import { payments, agents } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const result = await db
    .select()
    .from(payments)
    .leftJoin(agents, eq(payments.agentId, agents.id))
    .where(and(eq(payments.id, id), eq(payments.teamId, auth.team.id)))
    .limit(1);

  const row = result[0];
  if (!row) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      ...row.payments,
      agent: row.agents
        ? { id: row.agents.id, externalId: row.agents.externalId, name: row.agents.name }
        : null,
    },
  });
}
