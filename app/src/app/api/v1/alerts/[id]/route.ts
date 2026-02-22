import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/server/auth";
import { db } from "@/db/client";
import { alerts } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const resolved = (body as { resolved?: boolean })?.resolved;
  if (resolved !== true) {
    return NextResponse.json(
      { error: "Body must include { resolved: true }" },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(alerts)
    .set({ resolved: true })
    .where(and(eq(alerts.id, id), eq(alerts.teamId, auth.team.id)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
