import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { db } from "@/db/client";
import { teams } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

const COOKIE_NAME = "sentinel_session";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET env var is not set. Add it to .env and Vercel.");
  return new TextEncoder().encode(secret);
}

export interface SessionTeam {
  id: string;
  name: string;
  plan: string;
}

export async function createSessionToken(teamId: string, extra?: Record<string, string>) {
  return new SignJWT({ teamId, ...extra })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
  return response;
}

export async function getSession(): Promise<SessionTeam | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    const teamId = payload.teamId as string;
    if (!teamId) return null;

    const [team] = await db
      .select({ id: teams.id, name: teams.name, plan: teams.plan })
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);

    return team ?? null;
  } catch {
    return null;
  }
}
