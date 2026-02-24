import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/server/auth";
import { db } from "@/db/client";
import { scheduledReports } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select()
    .from(scheduledReports)
    .where(eq(scheduledReports.teamId, auth.team.id))
    .orderBy(scheduledReports.createdAt);

  return NextResponse.json({ data: rows });
}

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const now = new Date();

  const row = {
    id: nanoid(),
    teamId: auth.team.id,
    reportType: body.reportType ?? "pdf",
    frequency: body.frequency ?? "weekly",
    dayOfWeek: body.dayOfWeek ?? null,
    dayOfMonth: body.dayOfMonth ?? null,
    timeUtc: body.timeUtc ?? "09:00",
    timezone: body.timezone ?? "UTC",
    recipients: body.recipients ?? [],
    agentFilter: body.agentFilter ?? null,
    enabled: body.enabled !== false,
    lastSentAt: null,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(scheduledReports).values(row);
  return NextResponse.json(row, { status: 201 });
}
