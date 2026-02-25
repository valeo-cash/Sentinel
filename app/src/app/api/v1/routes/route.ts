import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/server/auth";
import { db } from "@/db/client";
import { paymentRoutes, routeEndpoints, routeExecutions } from "@/db/schema";
import { eq, and, desc, count, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const routes = await db
    .select()
    .from(paymentRoutes)
    .where(eq(paymentRoutes.teamId, auth.team.id))
    .orderBy(desc(paymentRoutes.updatedAt));

  const routesWithEndpoints = await Promise.all(
    routes.map(async (route) => {
      const endpoints = await db
        .select()
        .from(routeEndpoints)
        .where(eq(routeEndpoints.routeId, route.id))
        .orderBy(routeEndpoints.sortOrder);

      return { ...route, endpoints };
    })
  );

  return NextResponse.json({ data: routesWithEndpoints });
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

  if (!b.name || typeof b.name !== "string") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (!b.maxBudgetUsd || typeof b.maxBudgetUsd !== "string") {
    return NextResponse.json({ error: "maxBudgetUsd is required" }, { status: 400 });
  }
  const budgetVal = parseFloat(String(b.maxBudgetUsd).replace(/[^0-9.]/g, ""));
  if (isNaN(budgetVal) || budgetVal <= 0) {
    return NextResponse.json({ error: "maxBudgetUsd must be a positive number" }, { status: 400 });
  }

  const endpoints = b.endpoints as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(endpoints) || endpoints.length === 0 || endpoints.length > 20) {
    return NextResponse.json({ error: "endpoints must be an array of 1-20 items" }, { status: 400 });
  }

  const labels = new Set<string>();
  for (const ep of endpoints) {
    if (!ep.label || typeof ep.label !== "string") {
      return NextResponse.json({ error: "Each endpoint must have a label" }, { status: 400 });
    }
    if (!ep.url || typeof ep.url !== "string") {
      return NextResponse.json({ error: `Endpoint "${ep.label}" must have a url` }, { status: 400 });
    }
    if (labels.has(ep.label)) {
      return NextResponse.json({ error: `Duplicate endpoint label: "${ep.label}"` }, { status: 400 });
    }
    labels.add(ep.label);
    if (ep.maxUsd !== undefined && (typeof ep.maxUsd !== "number" || ep.maxUsd <= 0)) {
      return NextResponse.json({ error: `Endpoint "${ep.label}" maxUsd must be > 0` }, { status: 400 });
    }
    if (ep.weight !== undefined && (typeof ep.weight !== "number" || ep.weight <= 0)) {
      return NextResponse.json({ error: `Endpoint "${ep.label}" weight must be > 0` }, { status: 400 });
    }
  }

  const [existing] = await db
    .select({ id: paymentRoutes.id })
    .from(paymentRoutes)
    .where(and(eq(paymentRoutes.teamId, auth.team.id), eq(paymentRoutes.name, b.name)))
    .limit(1);

  if (existing) {
    return NextResponse.json({ error: `Route "${b.name}" already exists` }, { status: 409 });
  }

  const now = new Date();
  const routeId = `rt_${nanoid(16)}`;
  const strategy = (b.strategy as string) ?? "parallel";
  const mode = (b.mode as string) ?? "multiTx";

  await db.insert(paymentRoutes).values({
    id: routeId,
    teamId: auth.team.id,
    name: b.name,
    description: (b.description as string) ?? null,
    maxBudgetUsd: b.maxBudgetUsd,
    strategy,
    mode,
    timeout: (b.timeout as number) ?? null,
    metadata: (b.metadata as Record<string, unknown>) ?? null,
    isActive: true,
    executionCount: 0,
    createdAt: now,
    updatedAt: now,
  });

  const epValues = endpoints.map((ep, i) => ({
    id: `rep_${nanoid(16)}`,
    routeId,
    label: ep.label as string,
    url: ep.url as string,
    method: (ep.method as string) ?? "GET",
    weight: (ep.weight as number) ?? null,
    maxUsd: (ep.maxUsd as number) ?? null,
    required: ep.required !== false,
    headers: (ep.headers as Record<string, string>) ?? null,
    sortOrder: i,
    createdAt: now,
  }));

  for (const val of epValues) {
    await db.insert(routeEndpoints).values(val);
  }

  const [created] = await db
    .select()
    .from(paymentRoutes)
    .where(eq(paymentRoutes.id, routeId))
    .limit(1);

  const createdEndpoints = await db
    .select()
    .from(routeEndpoints)
    .where(eq(routeEndpoints.routeId, routeId))
    .orderBy(routeEndpoints.sortOrder);

  return NextResponse.json({ ...created, endpoints: createdEndpoints }, { status: 201 });
}
