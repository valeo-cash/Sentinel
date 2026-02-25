import { NextRequest, NextResponse } from "next/server";
import { createHash, createHmac } from "node:crypto";
import { db } from "@/db/client";
import { routeExecutions } from "@/db/schema";
import { eq } from "drizzle-orm";

function canonicalJson(obj: unknown): string {
  return JSON.stringify(obj, Object.keys(obj as Record<string, unknown>).sort());
}

function computeReceiptHash(receipt: Record<string, unknown>): string {
  const { receiptHash: _, sentinelSig: __, ...rest } = receipt;
  return createHash("sha256").update(canonicalJson(rest)).digest("hex");
}

function verifyHmac(receiptHash: string, sentinelSig: string): boolean {
  const signingKey = process.env.SENTINEL_SIGNING_KEY;
  if (!signingKey) return false;
  const expected = createHmac("sha256", signingKey).update(receiptHash).digest("hex");
  return expected === sentinelSig;
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;

  // Option A: Full receipt — server recomputes hash
  if (b.receipt && typeof b.receipt === "object") {
    const receipt = b.receipt as Record<string, unknown>;
    const recomputedHash = computeReceiptHash(receipt);

    const [execution] = await db
      .select({
        id: routeExecutions.id,
        routeName: routeExecutions.routeName,
        sentinelSig: routeExecutions.sentinelSig,
        createdAt: routeExecutions.createdAt,
      })
      .from(routeExecutions)
      .where(eq(routeExecutions.receiptHash, recomputedHash))
      .limit(1);

    if (!execution) {
      return NextResponse.json({
        verified: false,
        error: "No matching execution found for this receipt",
        receiptHash: recomputedHash,
      });
    }

    const signingKey = process.env.SENTINEL_SIGNING_KEY;
    if (!signingKey) {
      return NextResponse.json({
        verified: false,
        error: "Verification unavailable — signing key not configured",
        receiptHash: recomputedHash,
        executionId: execution.id,
      });
    }

    const sigValid = execution.sentinelSig
      ? verifyHmac(recomputedHash, execution.sentinelSig)
      : false;

    return NextResponse.json({
      verified: sigValid,
      receiptHash: recomputedHash,
      executionId: execution.id,
      routeName: execution.routeName,
      createdAt: execution.createdAt,
    });
  }

  // Option B: Fast path — receiptHash + sentinelSig pair
  if (b.receiptHash && typeof b.receiptHash === "string") {
    const receiptHash = b.receiptHash;
    const sentinelSig = b.sentinelSig as string | undefined;

    if (sentinelSig) {
      const sigValid = verifyHmac(receiptHash, sentinelSig);

      if (sigValid) {
        const [execution] = await db
          .select({
            id: routeExecutions.id,
            routeName: routeExecutions.routeName,
            createdAt: routeExecutions.createdAt,
          })
          .from(routeExecutions)
          .where(eq(routeExecutions.receiptHash, receiptHash))
          .limit(1);

        return NextResponse.json({
          verified: true,
          receiptHash,
          executionId: execution?.id ?? null,
          routeName: execution?.routeName ?? null,
          createdAt: execution?.createdAt ?? null,
        });
      }

      return NextResponse.json({
        verified: false,
        error: "Signature verification failed",
        receiptHash,
      });
    }

    const [execution] = await db
      .select({
        id: routeExecutions.id,
        routeName: routeExecutions.routeName,
        sentinelSig: routeExecutions.sentinelSig,
        createdAt: routeExecutions.createdAt,
      })
      .from(routeExecutions)
      .where(eq(routeExecutions.receiptHash, receiptHash))
      .limit(1);

    if (!execution) {
      return NextResponse.json({
        verified: false,
        error: "No matching execution found",
        receiptHash,
      });
    }

    return NextResponse.json({
      verified: !!execution.sentinelSig,
      receiptHash,
      executionId: execution.id,
      routeName: execution.routeName,
      createdAt: execution.createdAt,
    });
  }

  return NextResponse.json(
    { error: "Provide either 'receipt' (full object) or 'receiptHash' (string)" },
    { status: 400 },
  );
}
