import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { db } from "@/db/client";
import { emailCodes, teams, authAccounts } from "@/db/schema";
import { and, eq, gt } from "drizzle-orm";
import { createSessionToken, setSessionCookie } from "@/server/session";

export async function POST(req: NextRequest) {
  try {
    const { email, code } = (await req.json()) as { email?: string; code?: string };

    if (!email || !code || code.length !== 6) {
      return NextResponse.json({ error: "Email and 6-digit code are required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const now = new Date();

    const [entry] = await db
      .select()
      .from(emailCodes)
      .where(
        and(
          eq(emailCodes.email, normalizedEmail),
          eq(emailCodes.code, code),
          eq(emailCodes.used, false),
          gt(emailCodes.expiresAt, now),
        ),
      )
      .limit(1);

    if (!entry) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 });
    }

    await db
      .update(emailCodes)
      .set({ used: true })
      .where(eq(emailCodes.id, entry.id));

    const [existing] = await db
      .select()
      .from(authAccounts)
      .where(and(eq(authAccounts.provider, "email"), eq(authAccounts.providerId, normalizedEmail)))
      .limit(1);

    let teamId: string;

    if (existing) {
      teamId = existing.teamId;
    } else {
      teamId = `team_${nanoid()}`;

      await db.insert(teams).values({
        id: teamId,
        name: normalizedEmail.split("@")[0] ?? normalizedEmail,
        plan: "free",
        apiKeyHash: "",
        createdAt: now,
        updatedAt: now,
      });

      await db.insert(authAccounts).values({
        id: `auth_${nanoid()}`,
        teamId,
        provider: "email",
        providerId: normalizedEmail,
        createdAt: now,
      });
    }

    const jwt = await createSessionToken(teamId, { email: normalizedEmail });
    const response = NextResponse.json({ ok: true, redirect: "/dashboard/explorer" });
    return setSessionCookie(response, jwt);
  } catch (err) {
    console.error("Verify code error:", err);
    return NextResponse.json({ error: "Verification failed. Please try again." }, { status: 500 });
  }
}
