import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/server/auth";
import { db } from "@/db/client";
import { alertChannels } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select()
    .from(alertChannels)
    .where(eq(alertChannels.teamId, auth.team.id))
    .orderBy(alertChannels.createdAt);

  return NextResponse.json({ data: rows });
}

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { channel, config, severities, digestMode, enabled } = body;

  if (!channel || !config || !severities) {
    return NextResponse.json({ error: "channel, config, and severities are required" }, { status: 400 });
  }

  const now = new Date();
  const row = {
    id: nanoid(),
    teamId: auth.team.id,
    channel: channel as string,
    config: config as Record<string, unknown>,
    severities: severities as string[],
    digestMode: digestMode === true,
    enabled: enabled !== false,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(alertChannels).values(row);
  return NextResponse.json(row, { status: 201 });
}
