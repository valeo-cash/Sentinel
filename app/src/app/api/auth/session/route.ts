import { NextResponse } from "next/server";
import { getSession } from "@/server/session";
import { db } from "@/db/client";
import { authAccounts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const team = await getSession();
  if (!team) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const accounts = await db
    .select({ provider: authAccounts.provider, providerId: authAccounts.providerId })
    .from(authAccounts)
    .where(eq(authAccounts.teamId, team.id));

  return NextResponse.json({
    id: team.id,
    name: team.name,
    plan: team.plan,
    authMethods: accounts.map((a) => ({ provider: a.provider, id: a.providerId })),
  });
}
