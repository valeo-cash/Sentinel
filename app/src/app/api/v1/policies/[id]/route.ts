import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/server/auth";
import { policySchema } from "@/server/validation";
import { db } from "@/db/client";
import { budgetPolicies } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

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
  const [updated] = await db
    .update(budgetPolicies)
    .set({
      name: parsed.data.name,
      agentExternalId: parsed.data.agent_external_id ?? null,
      policy: parsed.data.policy as Record<string, unknown>,
      isActive: parsed.data.is_active ?? true,
      updatedAt: now,
    })
    .where(and(eq(budgetPolicies.id, id), eq(budgetPolicies.teamId, auth.team.id)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Policy not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [deleted] = await db
    .delete(budgetPolicies)
    .where(and(eq(budgetPolicies.id, id), eq(budgetPolicies.teamId, auth.team.id)))
    .returning({ id: budgetPolicies.id });

  if (!deleted) {
    return NextResponse.json({ error: "Policy not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
