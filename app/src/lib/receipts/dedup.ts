import { db } from "@/db/client";
import { receipts } from "@/db/schema";
import { eq, and, gte } from "drizzle-orm";

const DEFAULT_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

export async function checkDuplicate(params: {
  teamId: string;
  endpoint: string;
  requestHash: string;
  maxAge?: number;
}): Promise<typeof receipts.$inferSelect | null> {
  const cutoff = new Date(Date.now() - (params.maxAge ?? DEFAULT_MAX_AGE_MS));

  const [match] = await db
    .select()
    .from(receipts)
    .where(
      and(
        eq(receipts.teamId, params.teamId),
        eq(receipts.endpoint, params.endpoint),
        eq(receipts.requestHash, params.requestHash),
        gte(receipts.createdAt, cutoff)
      )
    )
    .limit(1);

  return match ?? null;
}
