import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/server/auth";
import { db } from "@/db/client";
import { receipts } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const txHash = req.nextUrl.searchParams.get("txHash");
  const responseHash = req.nextUrl.searchParams.get("responseHash");
  const endpoint = req.nextUrl.searchParams.get("endpoint");

  if (!responseHash && !endpoint && !txHash) {
    return NextResponse.json(
      { error: "txHash, responseHash, or endpoint query param required" },
      { status: 400 }
    );
  }

  // txHash-only lookups are public (hashes are on-chain anyway)
  if (txHash && !responseHash && !endpoint) {
    const rows = await db
      .select()
      .from(receipts)
      .where(eq(receipts.txHash, txHash))
      .limit(50);

    const publicRows = rows.map(({ teamId: _, ...rest }) => rest);
    return NextResponse.json({ data: publicRows });
  }

  const auth = await authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const conditions = [eq(receipts.teamId, auth.team.id)];
  if (txHash) conditions.push(eq(receipts.txHash, txHash));
  if (responseHash) conditions.push(eq(receipts.responseHash, responseHash));
  if (endpoint) conditions.push(eq(receipts.endpoint, endpoint));

  const rows = await db
    .select()
    .from(receipts)
    .where(and(...conditions))
    .limit(50);

  return NextResponse.json({ data: rows });
}
