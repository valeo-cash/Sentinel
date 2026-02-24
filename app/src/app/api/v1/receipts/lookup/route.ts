import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/server/auth";
import { db } from "@/db/client";
import { receipts } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const responseHash = req.nextUrl.searchParams.get("responseHash");
  const endpoint = req.nextUrl.searchParams.get("endpoint");

  if (!responseHash && !endpoint) {
    return NextResponse.json(
      { error: "responseHash or endpoint query param required" },
      { status: 400 }
    );
  }

  const conditions = [eq(receipts.teamId, auth.team.id)];
  if (responseHash) conditions.push(eq(receipts.responseHash, responseHash));
  if (endpoint) conditions.push(eq(receipts.endpoint, endpoint));

  const rows = await db
    .select()
    .from(receipts)
    .where(and(...conditions))
    .limit(50);

  return NextResponse.json({ data: rows });
}
