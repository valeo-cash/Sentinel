import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/server/auth";
import { paymentQuerySchema } from "@/server/validation";
import { db } from "@/db/client";
import { payments, agents } from "@/db/schema";
import { eq, and, gte, lte, desc, asc, count, like, lt, gt } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = paymentQuerySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query params", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const q = parsed.data;
  const conditions = [eq(payments.teamId, auth.team.id)];

  if (q.agent_id) {
    conditions.push(eq(agents.externalId, q.agent_id));
  }
  if (q.category) conditions.push(eq(payments.category, q.category));
  if (q.network) conditions.push(eq(payments.network, q.network));
  if (q.status) conditions.push(eq(payments.status, q.status));
  if (q.endpoint) conditions.push(like(payments.endpointDomain, `%${q.endpoint}%`));
  if (q.tx_hash) conditions.push(eq(payments.txHash, q.tx_hash));
  if (q.task_id) conditions.push(eq(payments.taskId, q.task_id));
  if (q.from) conditions.push(gte(payments.timestamp, q.from));
  if (q.to) conditions.push(lte(payments.timestamp, q.to));
  if (q.min_amount != null) conditions.push(gte(payments.amountUsd, q.min_amount));
  if (q.max_amount != null) conditions.push(lte(payments.amountUsd, q.max_amount));

  const where = and(...conditions);

  const [sortField, sortDir] = q.sort.split("_") as [string, "asc" | "desc"];
  const orderCol =
    sortField === "timestamp"
      ? payments.timestamp
      : sortField === "amount_usd"
        ? payments.amountUsd
        : payments.createdAt;
  const orderFn = sortDir === "asc" ? asc : desc;

  const limit = Math.min(q.limit ?? 50, 200);

  const cursorConditions = [...conditions];
  if (q.cursor) {
    const cursorTs = new Date(parseInt(q.cursor, 10));
    cursorConditions.push(
      sortDir === "desc"
        ? lt(payments.createdAt, cursorTs)
        : gt(payments.createdAt, cursorTs)
    );
  }

  const finalWhere = and(...cursorConditions);

  const [totalResult] = await db
    .select({ count: count() })
    .from(payments)
    .innerJoin(agents, eq(payments.agentId, agents.id))
    .where(where);

  const total = Number((totalResult as { count: number })?.count ?? 0);

  const rows = await db
    .select({
      payment: payments,
      agent_external_id: agents.externalId,
    })
    .from(payments)
    .innerJoin(agents, eq(payments.agentId, agents.id))
    .where(finalWhere)
    .orderBy(orderFn(orderCol))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const data = rows.slice(0, limit).map((r) => ({
    ...r.payment,
    agent_external_id: r.agent_external_id,
  }));
  const last = data[data.length - 1];
  const next_cursor =
    hasMore && last ? String(last.createdAt?.getTime() ?? "") : null;

  return NextResponse.json({
    data,
    next_cursor,
    total,
  });
}
