import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/server/auth";
import { db } from "@/db/client";
import { scheduledReports } from "@/db/schema";
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
    .from(scheduledReports)
    .where(and(eq(scheduledReports.id, id), eq(scheduledReports.teamId, auth.team.id)));

  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  for (const key of [
    "reportType", "frequency", "dayOfWeek", "dayOfMonth",
    "timeUtc", "timezone", "recipients", "agentFilter", "enabled",
  ]) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  await db.update(scheduledReports).set(updates).where(eq(scheduledReports.id, id));
  const [updated] = await db.select().from(scheduledReports).where(eq(scheduledReports.id, id));
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
    .delete(scheduledReports)
    .where(and(eq(scheduledReports.id, id), eq(scheduledReports.teamId, auth.team.id)));

  return NextResponse.json({ ok: true });
}
