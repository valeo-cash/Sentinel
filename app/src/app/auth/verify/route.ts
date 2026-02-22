import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { db } from "@/db/client";
import { magicLinks, teams, authAccounts } from "@/db/schema";
import { and, eq, gt } from "drizzle-orm";
import { createSessionToken, setSessionCookie } from "@/server/session";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/login?error=missing_token", req.url));
  }

  const now = new Date();

  const [link] = await db
    .select()
    .from(magicLinks)
    .where(
      and(
        eq(magicLinks.token, token),
        eq(magicLinks.used, false),
        gt(magicLinks.expiresAt, now)
      )
    )
    .limit(1);

  if (!link) {
    return NextResponse.redirect(new URL("/login?error=invalid_token", req.url));
  }

  await db
    .update(magicLinks)
    .set({ used: true })
    .where(eq(magicLinks.id, link.id));

  const email = link.email.toLowerCase().trim();

  const [existing] = await db
    .select()
    .from(authAccounts)
    .where(and(eq(authAccounts.provider, "email"), eq(authAccounts.providerId, email)))
    .limit(1);

  let teamId: string;

  if (existing) {
    teamId = existing.teamId;
  } else {
    teamId = `team_${nanoid()}`;

    await db.insert(teams).values({
      id: teamId,
      name: email.split("@")[0] ?? email,
      plan: "free",
      apiKeyHash: "",
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(authAccounts).values({
      id: `auth_${nanoid()}`,
      teamId,
      provider: "email",
      providerId: email,
      createdAt: now,
    });
  }

  const jwt = await createSessionToken(teamId, { email });
  const response = NextResponse.redirect(new URL("/dashboard", req.url));
  return setSessionCookie(response, jwt);
}
