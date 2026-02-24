import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/server/auth";
import { db } from "@/db/client";
import { alertChannels } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { dispatchToChannel } from "@/lib/alerts/send";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [ch] = await db
    .select()
    .from(alertChannels)
    .where(and(eq(alertChannels.id, id), eq(alertChannels.teamId, auth.team.id)));

  if (!ch) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const testAlert = {
    severity: "info" as const,
    title: "Test Alert from Sentinel",
    message: "This is a test alert to verify your integration is working.",
    agent: "test-agent",
    amount: 0,
    timestamp: new Date().toISOString(),
    dashboard: "https://sentinel.valeocash.com/dashboard",
  };

  try {
    await dispatchToChannel(ch.channel, ch.config as Record<string, unknown>, testAlert);
    return NextResponse.json({ ok: true, message: "Test alert sent" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to send test alert";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
