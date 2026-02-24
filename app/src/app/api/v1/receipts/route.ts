import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/server/auth";
import { db } from "@/db/client";
import { receipts } from "@/db/schema";
import { eq, and, gte, lte, desc, sql, count } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const agentId = sp.get("agentId");
  const endpoint = sp.get("endpoint");
  const from = sp.get("from");
  const to = sp.get("to");
  const limit = Math.min(parseInt(sp.get("limit") || "50", 10), 200);
  const offset = parseInt(sp.get("offset") || "0", 10);

  const conditions = [eq(receipts.teamId, auth.team.id)];
  if (agentId) conditions.push(eq(receipts.agentId, agentId));
  if (endpoint) conditions.push(eq(receipts.endpoint, endpoint));
  if (from) conditions.push(gte(receipts.createdAt, new Date(from)));
  if (to) conditions.push(lte(receipts.createdAt, new Date(to)));

  const where = and(...conditions);

  const [rows, [total]] = await Promise.all([
    db
      .select()
      .from(receipts)
      .where(where)
      .orderBy(desc(receipts.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(receipts)
      .where(where),
  ]);

  return NextResponse.json({ data: rows, total: total?.count ?? 0 });
}
