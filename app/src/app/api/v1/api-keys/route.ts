import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import { nanoid } from "nanoid";
import { authenticateRequest } from "@/server/auth";
import { db } from "@/db/client";
import { apiKeys } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const keys = await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      lastUsedAt: apiKeys.lastUsedAt,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.teamId, auth.team.id))
    .orderBy(apiKeys.createdAt);

  return NextResponse.json({ data: keys });
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const name = (body.name as string) || "Default";

  const rawKey = `sk_sentinel_${randomBytes(24).toString("hex")}`;
  const hash = createHash("sha256").update(rawKey).digest("hex");
  const keyPrefix = rawKey.slice(0, 16);

  await db.insert(apiKeys).values({
    id: `key_${nanoid()}`,
    teamId: auth.team.id,
    name,
    keyHash: hash,
    keyPrefix,
    createdAt: new Date(),
  });

  return NextResponse.json({
    api_key: rawKey,
    prefix: keyPrefix,
    name,
    message: "Store this key securely. It will not be shown again.",
  });
}
