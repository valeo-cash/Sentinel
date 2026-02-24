import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/server/auth";
import { db } from "@/db/client";
import { alertChannels } from "@/db/schema";
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
    .from(alertChannels)
    .where(and(eq(alertChannels.id, id), eq(alertChannels.teamId, auth.team.id)));

  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (body.config !== undefined) updates.config = body.config;
  if (body.severities !== undefined) updates.severities = body.severities;
  if (body.digestMode !== undefined) updates.digestMode = body.digestMode;
  if (body.enabled !== undefined) updates.enabled = body.enabled;

  await db.update(alertChannels).set(updates).where(eq(alertChannels.id, id));

  const [updated] = await db.select().from(alertChannels).where(eq(alertChannels.id, id));
  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await db
    .delete(alertChannels)
    .where(and(eq(alertChannels.id, id), eq(alertChannels.teamId, auth.team.id)));

  return NextResponse.json({ ok: true });
}
