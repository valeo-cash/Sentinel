import { db } from "@/db/client";
import { scheduledReports, payments, teams } from "@/db/schema";
import { eq, and, gte, lte, sql, count } from "drizzle-orm";

export async function checkAndSendReports(): Promise<number> {
  const schedules = await db
    .select()
    .from(scheduledReports)
    .where(eq(scheduledReports.enabled, true));

  let sent = 0;
  const now = new Date();

  for (const schedule of schedules) {
    try {
      if (!isDue(schedule, now)) continue;

      const [team] = await db
        .select()
        .from(teams)
        .where(eq(teams.id, schedule.teamId));

      if (!team) continue;

      const { from, to } = getReportDateRange(schedule, now);
      const recipients = schedule.recipients as string[];
      if (!recipients.length) continue;

      const conditions = [
        eq(payments.teamId, schedule.teamId),
        gte(payments.timestamp, from),
        lte(payments.timestamp, to),
      ];

      if (schedule.agentFilter) {
        conditions.push(eq(payments.agentId, schedule.agentFilter));
      }

      const where = and(...conditions);

      const rows = await db
        .select()
        .from(payments)
        .where(where)
        .orderBy(payments.timestamp)
        .limit(1000);

      const [agg] = await db
        .select({
          totalSpent: sql<number>`COALESCE(SUM(${payments.amountUsd}), 0)`,
          totalPayments: count(),
        })
        .from(payments)
        .where(where);

      const report = generateReportContent(schedule.reportType, rows, {
        totalSpent: Number(agg?.totalSpent ?? 0),
        totalPayments: Number(agg?.totalPayments ?? 0),
        from,
        to,
        teamName: team.name,
      });

      await sendReportEmail(
        recipients,
        `Sentinel Report — ${team.name} — ${new Date().toISOString().slice(0, 10)}`,
        report,
        schedule.reportType,
        team.name
      );

      await db
        .update(scheduledReports)
        .set({ lastSentAt: now })
        .where(eq(scheduledReports.id, schedule.id));

      sent++;
    } catch (err) {
      console.error(`[scheduler] Failed to send report ${schedule.id}:`, err);
    }
  }

  return sent;
}

interface ScheduleRow {
  frequency: string;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  timeUtc: string;
  timezone: string;
  lastSentAt: Date | null;
}

function isDue(schedule: ScheduleRow, now: Date): boolean {
  const hourNow = now.getUTCHours();
  const [schedH] = (schedule.timeUtc ?? "09:00").split(":").map(Number);
  if (hourNow !== schedH) return false;

  if (schedule.lastSentAt) {
    const hoursSince = (now.getTime() - schedule.lastSentAt.getTime()) / 3600000;
    if (hoursSince < 20) return false;
  }

  const dayOfWeek = now.getUTCDay();
  const dayOfMonth = now.getUTCDate();

  switch (schedule.frequency) {
    case "daily":
      return true;
    case "weekly":
      return schedule.dayOfWeek == null || schedule.dayOfWeek === dayOfWeek;
    case "monthly":
      return schedule.dayOfMonth == null || schedule.dayOfMonth === dayOfMonth;
    default:
      return false;
  }
}

function getReportDateRange(schedule: ScheduleRow, now: Date) {
  const to = now.toISOString();
  let fromDate: Date;

  switch (schedule.frequency) {
    case "daily":
      fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case "weekly":
      fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "monthly":
      fromDate = new Date(now);
      fromDate.setUTCMonth(fromDate.getUTCMonth() - 1);
      break;
    default:
      fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }

  return { from: fromDate.toISOString(), to };
}

interface ReportMeta {
  totalSpent: number;
  totalPayments: number;
  from: string;
  to: string;
  teamName: string;
}

function generateReportContent(
  type: string,
  rows: Array<Record<string, unknown>>,
  meta: ReportMeta
): string {
  if (type === "json") {
    return JSON.stringify({ meta, payments: rows }, null, 2);
  }

  if (type === "csv") {
    if (!rows.length) return "No payments in this period.";
    const headers = Object.keys(rows[0]!);
    const lines = [headers.join(",")];
    for (const row of rows) {
      lines.push(headers.map((h) => JSON.stringify(String(row[h] ?? ""))).join(","));
    }
    return lines.join("\n");
  }

  // PDF fallback: plain-text summary (full PDF generation is client-side with jsPDF)
  let text = `Sentinel Audit Report — ${meta.teamName}\n`;
  text += `Period: ${meta.from.slice(0, 10)} to ${meta.to.slice(0, 10)}\n\n`;
  text += `Total Spent: $${meta.totalSpent.toFixed(2)}\n`;
  text += `Total Payments: ${meta.totalPayments}\n\n`;
  text += `Payment Records:\n`;
  for (const row of rows.slice(0, 50)) {
    text += `  ${row.timestamp} | ${row.endpointDomain} | $${Number(row.amountUsd ?? 0).toFixed(4)} | ${row.status}\n`;
  }
  if (rows.length > 50) text += `  ... and ${rows.length - 50} more\n`;
  return text;
}

async function sendReportEmail(
  recipients: string[],
  subject: string,
  content: string,
  reportType: string,
  teamName: string
) {
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    const ext = reportType === "json" ? "json" : reportType === "csv" ? "csv" : "txt";
    const filename = `sentinel-report-${new Date().toISOString().slice(0, 10)}.${ext}`;

    await resend.emails.send({
      from: "Sentinel Reports <reports@sentinel.valeocash.com>",
      to: recipients,
      subject,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#191919;color:#fafafa;border-radius:12px;">
          <h2 style="margin:0 0 12px;color:#fff;">Sentinel Report</h2>
          <p style="color:#a1a1aa;">Your scheduled ${reportType.toUpperCase()} report for ${teamName} is attached.</p>
          <a href="https://sentinel.valeocash.com/dashboard" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#f3f0eb;color:#191919;text-decoration:none;border-radius:8px;font-weight:600;">Open Dashboard</a>
        </div>
      `,
      attachments: [
        {
          filename,
          content: Buffer.from(content).toString("base64"),
        },
      ],
    });
  } catch (err) {
    console.error("[sendReportEmail] Failed:", err);
    throw err;
  }
}
