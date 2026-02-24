import { NextRequest, NextResponse } from "next/server";
import { createHash, randomUUID } from "node:crypto";
import { authenticateRequest } from "@/server/auth";
import { eventsPayloadSchema } from "@/server/validation";
import { processEvents } from "@/server/ingest";
import { db } from "@/db/client";
import { teams } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

async function getOrCreateAnonTeam(
  agentId: string,
  ip: string,
): Promise<{ teamId: string; claimToken: string }> {
  const hash = createHash("sha256").update(`${agentId}:${ip}`).digest("hex");
  const anonId = `anon_${hash.slice(0, 16)}`;

  const [existing] = await db
    .select()
    .from(teams)
    .where(eq(teams.id, anonId))
    .limit(1);

  if (existing) {
    return { teamId: existing.id, claimToken: existing.claimToken || "" };
  }

  const claimToken = randomUUID();
  const now = new Date();
  await db.insert(teams).values({
    id: anonId,
    name: `anon-${hash.slice(0, 8)}`,
    plan: "anonymous",
    apiKeyHash: "",
    claimToken,
    createdAt: now,
    updatedAt: now,
  });

  return { teamId: anonId, claimToken };
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const parsed = eventsPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Authenticated team
  if (auth) {
    const result = await processEvents(auth.team.id, parsed.data.events);
    return NextResponse.json(
      {
        ingested: result.ingested,
        errors: result.errors,
        alerts_created: result.alerts_created,
      },
      { headers: { "X-RateLimit-Limit": "100" } },
    );
  }

  // Anonymous mode: create/find anon team from agentId + IP
  const firstEvent = parsed.data.events[0];
  if (!firstEvent) {
    return NextResponse.json({ error: "No events provided" }, { status: 400 });
  }

  const ip = getClientIp(request);
  const { teamId, claimToken } = await getOrCreateAnonTeam(
    firstEvent.agent_id,
    ip,
  );

  const result = await processEvents(teamId, parsed.data.events);

  return NextResponse.json(
    {
      ingested: result.ingested,
      errors: result.errors,
      alerts_created: result.alerts_created,
    },
    {
      headers: {
        "X-RateLimit-Limit": "100",
        "X-Sentinel-Claim-Token": claimToken,
      },
    },
  );
}
