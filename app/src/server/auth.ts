import { NextRequest } from "next/server";
import { createHash } from "node:crypto";
import { jwtVerify } from "jose";
import { db } from "@/db/client";
import { teams, apiKeys } from "@/db/schema";
import { eq } from "drizzle-orm";

export type AuthenticatedTeam = {
  id: string;
  name: string;
  plan: string;
};

/**
 * Authenticates a request. Tries two methods in order:
 * 1. Authorization: Bearer <api_key> — hashes key, looks up team by api_key_hash
 * 2. sentinel_session cookie — verifies JWT, looks up team by id
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<{ team: AuthenticatedTeam } | null> {
  // Method 1: API key in Authorization header
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const key = authHeader.slice(7).trim();
    if (key) {
      const hash = createHash("sha256").update(key).digest("hex");

      // Check api_keys table first (new multi-key system)
      const [apiKeyRow] = await db
        .select({ teamId: apiKeys.teamId })
        .from(apiKeys)
        .where(eq(apiKeys.keyHash, hash))
        .limit(1);

      if (apiKeyRow) {
        await db
          .update(apiKeys)
          .set({ lastUsedAt: new Date() })
          .where(eq(apiKeys.keyHash, hash));

        const [team] = await db
          .select({ id: teams.id, name: teams.name, plan: teams.plan })
          .from(teams)
          .where(eq(teams.id, apiKeyRow.teamId))
          .limit(1);

        if (team) return { team };
      }

      // Fall back to legacy apiKeyHash on teams table
      const [team] = await db
        .select({ id: teams.id, name: teams.name, plan: teams.plan })
        .from(teams)
        .where(eq(teams.apiKeyHash, hash))
        .limit(1);

      if (team) {
        return { team };
      }
    }
  }

  // Method 2: Session cookie
  const sessionToken = request.cookies.get("sentinel_session")?.value;
  if (sessionToken) {
    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) return null;
      const { payload } = await jwtVerify(
        sessionToken,
        new TextEncoder().encode(secret)
      );
      const teamId = payload.teamId as string;
      if (!teamId) return null;

      const [team] = await db
        .select({ id: teams.id, name: teams.name, plan: teams.plan })
        .from(teams)
        .where(eq(teams.id, teamId))
        .limit(1);

      if (team) {
        return { team };
      }
    } catch {
      // Invalid JWT
    }
  }

  return null;
}
