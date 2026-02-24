import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/server/auth";
import { db } from "@/db/client";
import { customDashboards } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select()
    .from(customDashboards)
    .where(eq(customDashboards.teamId, auth.team.id))
    .orderBy(customDashboards.createdAt);

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
    name: body.name ?? "My Dashboard",
    layout: body.layout ?? [],
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(customDashboards).values(row);
  return NextResponse.json(row, { status: 201 });
}
