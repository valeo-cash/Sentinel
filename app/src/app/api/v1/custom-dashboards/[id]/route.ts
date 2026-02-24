import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/server/auth";
import { db } from "@/db/client";
import { customDashboards } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const [existing] = await db
    .select()
    .from(customDashboards)
    .where(and(eq(customDashboards.id, id), eq(customDashboards.teamId, auth.team.id)));

  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (body.name !== undefined) updates.name = body.name;
  if (body.layout !== undefined) updates.layout = body.layout;

  await db.update(customDashboards).set(updates).where(eq(customDashboards.id, id));
  const [updated] = await db.select().from(customDashboards).where(eq(customDashboards.id, id));
  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db
    .delete(customDashboards)
    .where(and(eq(customDashboards.id, id), eq(customDashboards.teamId, auth.team.id)));

  return NextResponse.json({ ok: true });
}
