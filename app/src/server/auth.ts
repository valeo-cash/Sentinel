import { NextRequest } from "next/server";
import { createHash } from "node:crypto";
import { db } from "@/db/client";
import { teams } from "@/db/schema";
import { eq } from "drizzle-orm";

export type AuthenticatedTeam = {
  id: string;
  name: string;
  plan: string;
};

/**
 * Authenticates a request using the Authorization: Bearer <key> header.
 * Hashes the key with SHA-256 and looks up the team by api_key_hash.
 * Returns { team } object or null if unauthorized.
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<{ team: AuthenticatedTeam } | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const key = authHeader.slice(7).trim();
  if (!key) {
    return null;
  }

  const hash = createHash("sha256").update(key).digest("hex");
  const [team] = await db
    .select({
      id: teams.id,
      name: teams.name,
      plan: teams.plan,
    })
    .from(teams)
    .where(eq(teams.apiKeyHash, hash))
    .limit(1);

  if (!team) {
    return null;
  }

  return {
    team: {
      id: team.id,
      name: team.name,
      plan: team.plan,
    },
  };
}
