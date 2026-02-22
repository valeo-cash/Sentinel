import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/server/auth";
import { db } from "@/db/client";
import { teams } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [team] = await db
    .select({
      id: teams.id,
      name: teams.name,
      plan: teams.plan,
      createdAt: teams.createdAt,
    })
    .from(teams)
    .where(eq(teams.id, auth.team.id))
    .limit(1);

  if (!team) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: team.id,
    name: team.name,
    plan: team.plan,
    createdAt: team.createdAt,
  });
}
