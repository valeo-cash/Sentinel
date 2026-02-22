import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/server/auth";
import { eventsPayloadSchema } from "@/server/validation";
import { processEvents } from "@/server/ingest";

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = eventsPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await processEvents(auth.team.id, parsed.data.events);

  return NextResponse.json(
    {
      ingested: result.ingested,
      errors: result.errors,
      alerts_created: result.alerts_created,
    },
    {
      headers: { "X-RateLimit-Limit": "100" },
    }
  );
}
