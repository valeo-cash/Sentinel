import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/server/auth";
import { policySchema } from "@/server/validation";
import { db } from "@/db/client";
import { budgetPolicies } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(budgetPolicies)
    .where(eq(budgetPolicies.teamId, auth.team.id));

  return NextResponse.json({ data: rows });
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

  const parsed = policySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const now = new Date();
  const id = nanoid();
  await db.insert(budgetPolicies).values({
    id,
    teamId: auth.team.id,
    name: parsed.data.name,
    agentExternalId: parsed.data.agent_external_id ?? null,
    policy: parsed.data.policy as Record<string, unknown>,
    isActive: parsed.data.is_active ?? true,
    createdAt: now,
    updatedAt: now,
  });

  const [created] = await db
    .select()
    .from(budgetPolicies)
    .where(eq(budgetPolicies.id, id))
    .limit(1);

  return NextResponse.json(created, { status: 201 });
}
