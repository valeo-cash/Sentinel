import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { receipts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyReceiptSignature } from "@/lib/receipts/generate";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [receipt] = await db
    .select()
    .from(receipts)
    .where(eq(receipts.id, id));

  if (!receipt) {
    return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
  }

  const valid = verifyReceiptSignature(receipt);

  const { teamId: _, ...publicReceipt } = receipt;

  return NextResponse.json(
    { valid, receipt: publicReceipt },
    {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    }
  );
}
