import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "node:crypto";
import { authenticateRequest } from "@/server/auth";
import { db } from "@/db/client";
import { routeExecutions, paymentRoutes } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

function computeSentinelSig(receiptHash: string): string | null {
  const signingKey = process.env.SENTINEL_SIGNING_KEY;
  if (!signingKey) {
    console.warn("[sentinel] SENTINEL_SIGNING_KEY not set — sentinelSig will be null");
    return null;
  }
  return createHmac("sha256", signingKey).update(receiptHash).digest("hex");
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;

  if (!b.routeName || typeof b.routeName !== "string") {
    return NextResponse.json({ error: "routeName is required" }, { status: 400 });
  }
  if (!b.receiptHash || typeof b.receiptHash !== "string") {
    return NextResponse.json({ error: "receiptHash is required" }, { status: 400 });
  }

  const now = new Date();
  const executionId = `rex_${nanoid(16)}`;

  const sentinelSig = computeSentinelSig(b.receiptHash);

  if (b.routeId) {
    await db
      .update(paymentRoutes)
      .set({
        executionCount: (await db
          .select({ count: paymentRoutes.executionCount })
          .from(paymentRoutes)
          .where(eq(paymentRoutes.id, b.routeId as string))
          .limit(1)
          .then((r) => (r[0]?.count ?? 0) + 1)),
        lastExecutedAt: now,
        updatedAt: now,
      })
      .where(and(
        eq(paymentRoutes.id, b.routeId as string),
        eq(paymentRoutes.teamId, auth.team.id),
      ));
  }

  await db.insert(routeExecutions).values({
    id: executionId,
    teamId: auth.team.id,
    routeId: (b.routeId as string) ?? null,
    routeName: b.routeName,
    agentId: (b.agentId as string) ?? null,
    success: b.success as boolean,
    strategy: (b.strategy as string) ?? "parallel",
    mode: (b.mode as string) ?? "multiTx",
    totalSpent: (b.totalSpent as string) ?? null,
    totalSpentUsd: (b.totalSpentUsd as number) ?? null,
    maxBudgetUsd: (b.maxBudgetUsd as number) ?? null,
    endpointCount: (b.endpointCount as number) ?? 0,
    successCount: (b.successCount as number) ?? 0,
    failedCount: (b.failedCount as number) ?? 0,
    totalTimeMs: (b.totalTimeMs as number) ?? null,
    receipt: (b.receipt as Record<string, unknown>) ?? null,
    receiptHash: b.receiptHash,
    sentinelSig,
    routeSnapshot: (b.routeSnapshot as Record<string, unknown>) ?? null,
    discoverySnapshot: (b.discoverySnapshot as Record<string, unknown>) ?? null,
    createdAt: now,
  });

  return NextResponse.json(
    { success: true, executionId, sentinelSig },
    { status: 201 },
  );
}

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = request.nextUrl.searchParams;
  const routeId = sp.get("routeId");
  const limit = Math.min(parseInt(sp.get("limit") || "20", 10), 100);
  const offset = parseInt(sp.get("offset") || "0", 10);

  const conditions = [eq(routeExecutions.teamId, auth.team.id)];
  if (routeId) conditions.push(eq(routeExecutions.routeId, routeId));

  const where = and(...conditions);

  const rows = await db
    .select()
    .from(routeExecutions)
    .where(where)
    .orderBy(desc(routeExecutions.createdAt))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({ data: rows });
}
