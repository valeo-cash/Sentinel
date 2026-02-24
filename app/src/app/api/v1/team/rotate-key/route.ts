import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { authenticateRequest } from "@/server/auth";
import { db } from "@/db/client";
import { teams } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const newKey = nanoid(32);
  const hash = createHash("sha256").update(newKey).digest("hex");

  const [updated] = await db
    .update(teams)
    .set({ apiKeyHash: hash })
    .where(eq(teams.id, auth.team.id))
    .returning({ id: teams.id });

  if (!updated) {
    return NextResponse.json({ error: "Failed to rotate key" }, { status: 500 });
  }

  return NextResponse.json({
    api_key: newKey,
    message: "Store this key securely. It will not be shown again.",
  });
}
