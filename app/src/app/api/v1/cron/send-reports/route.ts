import { NextRequest, NextResponse } from "next/server";
import { checkAndSendReports } from "@/lib/reports/scheduler";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  const expected = process.env.CRON_SECRET;

  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sent = await checkAndSendReports();
    return NextResponse.json({ ok: true, sent });
  } catch (err) {
    console.error("[cron/send-reports] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
