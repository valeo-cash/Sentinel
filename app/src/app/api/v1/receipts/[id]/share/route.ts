import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/server/auth";
import { db } from "@/db/client";
import { receipts } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [receipt] = await db
    .select()
    .from(receipts)
    .where(and(eq(receipts.id, id), eq(receipts.teamId, auth.team.id)));

  if (!receipt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sentinel.valeocash.com";
  const url = `${baseUrl}/receipt/${receipt.id}`;

  return NextResponse.json({ url });
}
