import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/server/auth";
import { db } from "@/db/client";
import { paymentRoutes, routeEndpoints, routeExecutions } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [route] = await db
    .select()
    .from(paymentRoutes)
    .where(and(eq(paymentRoutes.id, id), eq(paymentRoutes.teamId, auth.team.id)))
    .limit(1);

  if (!route) return NextResponse.json({ error: "Route not found" }, { status: 404 });

  const endpoints = await db
    .select()
    .from(routeEndpoints)
    .where(eq(routeEndpoints.routeId, id))
    .orderBy(routeEndpoints.sortOrder);

  const executions = await db
    .select()
    .from(routeExecutions)
    .where(eq(routeExecutions.routeId, id))
    .orderBy(desc(routeExecutions.createdAt))
    .limit(10);

  return NextResponse.json({ ...route, endpoints, recentExecutions: executions });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;

  const [existing] = await db
    .select()
    .from(paymentRoutes)
    .where(and(eq(paymentRoutes.id, id), eq(paymentRoutes.teamId, auth.team.id)))
    .limit(1);

  if (!existing) return NextResponse.json({ error: "Route not found" }, { status: 404 });

  if (b.name && b.name !== existing.name) {
    const [dup] = await db
      .select({ id: paymentRoutes.id })
      .from(paymentRoutes)
      .where(and(eq(paymentRoutes.teamId, auth.team.id), eq(paymentRoutes.name, b.name as string)))
      .limit(1);
    if (dup) return NextResponse.json({ error: `Route "${b.name}" already exists` }, { status: 409 });
  }

  const now = new Date();

  await db
    .update(paymentRoutes)
    .set({
      name: (b.name as string) ?? existing.name,
      description: b.description !== undefined ? (b.description as string) : existing.description,
      maxBudgetUsd: (b.maxBudgetUsd as string) ?? existing.maxBudgetUsd,
      strategy: (b.strategy as string) ?? existing.strategy,
      mode: (b.mode as string) ?? existing.mode,
      timeout: b.timeout !== undefined ? (b.timeout as number) : existing.timeout,
      metadata: b.metadata !== undefined ? (b.metadata as Record<string, unknown>) : existing.metadata,
      isActive: b.isActive !== undefined ? (b.isActive as boolean) : existing.isActive,
      updatedAt: now,
    })
    .where(eq(paymentRoutes.id, id));

  if (Array.isArray(b.endpoints)) {
    await db.delete(routeEndpoints).where(eq(routeEndpoints.routeId, id));

    const endpoints = b.endpoints as Array<Record<string, unknown>>;
    for (let i = 0; i < endpoints.length; i++) {
      const ep = endpoints[i]!;
      await db.insert(routeEndpoints).values({
        id: `rep_${nanoid(16)}`,
        routeId: id,
        label: ep.label as string,
        url: ep.url as string,
        method: (ep.method as string) ?? "GET",
        weight: (ep.weight as number) ?? null,
        maxUsd: (ep.maxUsd as number) ?? null,
        required: ep.required !== false,
        headers: (ep.headers as Record<string, string>) ?? null,
        sortOrder: i,
        createdAt: now,
      });
    }
  }

  const [updated] = await db
    .select()
    .from(paymentRoutes)
    .where(eq(paymentRoutes.id, id))
    .limit(1);

  const updatedEndpoints = await db
    .select()
    .from(routeEndpoints)
    .where(eq(routeEndpoints.routeId, id))
    .orderBy(routeEndpoints.sortOrder);

  return NextResponse.json({ ...updated, endpoints: updatedEndpoints });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [existing] = await db
    .select({ id: paymentRoutes.id })
    .from(paymentRoutes)
    .where(and(eq(paymentRoutes.id, id), eq(paymentRoutes.teamId, auth.team.id)))
    .limit(1);

  if (!existing) return NextResponse.json({ error: "Route not found" }, { status: 404 });

  await db.delete(routeEndpoints).where(eq(routeEndpoints.routeId, id));
  await db.delete(paymentRoutes).where(eq(paymentRoutes.id, id));

  return NextResponse.json({ success: true });
}
