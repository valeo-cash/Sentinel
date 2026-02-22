import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/server/auth";
import { alertQuerySchema } from "@/server/validation";
import { db } from "@/db/client";
import { alerts, agents } from "@/db/schema";
import { eq, and, gte, lte, desc, lt } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = alertQuerySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query params", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const q = parsed.data;
  const conditions = [eq(alerts.teamId, auth.team.id)];

  if (q.type) conditions.push(eq(alerts.type, q.type));
  if (q.severity) conditions.push(eq(alerts.severity, q.severity));
  if (q.resolved !== undefined) conditions.push(eq(alerts.resolved, q.resolved));
  if (q.agent_id) conditions.push(eq(agents.externalId, q.agent_id));
  if (q.from) conditions.push(gte(alerts.createdAt, new Date(q.from)));
  if (q.to) conditions.push(lte(alerts.createdAt, new Date(q.to)));
  if (q.cursor) {
    conditions.push(lt(alerts.createdAt, new Date(parseInt(q.cursor, 10))));
  }

  const where = and(...conditions);
  const limit = Math.min(q.limit ?? 50, 200);

  const rows = await db
    .select({
      alert: alerts,
      agent_external_id: agents.externalId,
    })
    .from(alerts)
    .leftJoin(agents, eq(alerts.agentId, agents.id))
    .where(where)
    .orderBy(desc(alerts.createdAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const data = rows.slice(0, limit).map((r) => ({
    ...r.alert,
    agent_external_id: r.agent_external_id,
  }));
  const last = data[data.length - 1];
  const next_cursor =
    hasMore && last ? String(last.createdAt?.getTime() ?? "") : null;

  return NextResponse.json({ data, next_cursor });
}
