import { db } from "@/db/client";
import { alertChannels } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface AlertPayload {
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
  agent: string;
  amount: number;
  timestamp: string;
  dashboard: string;
}

const SEVERITY_EMOJI: Record<string, string> = {
  critical: "🔴",
  warning: "🟡",
  info: "🔵",
};

export async function dispatchToChannel(
  channel: string,
  config: Record<string, unknown>,
  alert: AlertPayload
): Promise<void> {
  switch (channel) {
    case "slack":
      await sendSlack(config.url as string, alert);
      break;
    case "discord":
      await sendDiscord(config.url as string, alert);
      break;
    case "email":
      await sendEmail(config.emails as string[], alert);
      break;
    case "webhook":
      await sendWebhook(config.url as string, config.headers as Record<string, string> | undefined, alert);
      break;
    case "pagerduty":
      await sendPagerDuty(config.integrationKey as string, alert);
      break;
    case "teams":
      await sendTeams(config.url as string, alert);
      break;
  }
}

export async function sendAlert(teamId: string, alert: AlertPayload): Promise<void> {
  const channels = await db
    .select()
    .from(alertChannels)
    .where(eq(alertChannels.teamId, teamId));

  const enabled = channels.filter((ch) => ch.enabled);

  for (const ch of enabled) {
    const sev = ch.severities as string[];
    if (!sev.includes(alert.severity)) continue;

    try {
      await dispatchToChannel(ch.channel, ch.config as Record<string, unknown>, alert);
    } catch (err) {
      console.error(`[sendAlert] Failed to send to ${ch.channel} (${ch.id}):`, err);
    }
  }
}

async function sendSlack(url: string, alert: AlertPayload) {
  const emoji = SEVERITY_EMOJI[alert.severity] ?? "";
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: `${emoji} *${alert.title}*\nAgent: ${alert.agent}\nAmount: $${alert.amount.toFixed(2)}\nTime: ${alert.timestamp}\n<${alert.dashboard}|Open Dashboard>`,
    }),
  });
}

async function sendDiscord(url: string, alert: AlertPayload) {
  const color = alert.severity === "critical" ? 0xef4444 : alert.severity === "warning" ? 0xeab308 : 0x3b82f6;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      embeds: [{
        title: alert.title,
        description: alert.message,
        color,
        fields: [
          { name: "Agent", value: alert.agent, inline: true },
          { name: "Amount", value: `$${alert.amount.toFixed(2)}`, inline: true },
          { name: "Time", value: alert.timestamp, inline: true },
        ],
        url: alert.dashboard,
      }],
    }),
  });
}

async function sendEmail(emails: string[], alert: AlertPayload) {
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const emoji = SEVERITY_EMOJI[alert.severity] ?? "";
    await resend.emails.send({
      from: "Sentinel Alerts <alerts@sentinel.valeocash.com>",
      to: emails,
      subject: `${emoji} Sentinel Alert: ${alert.title}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#191919;color:#fafafa;border-radius:12px;">
          <h2 style="margin:0 0 12px;color:#fff;">${alert.title}</h2>
          <p style="color:#a1a1aa;">${alert.message}</p>
          <table style="width:100%;margin:16px 0;font-size:14px;color:#d1d5db;">
            <tr><td style="padding:4px 0;color:#71717a;">Agent</td><td>${alert.agent}</td></tr>
            <tr><td style="padding:4px 0;color:#71717a;">Amount</td><td>$${alert.amount.toFixed(2)}</td></tr>
            <tr><td style="padding:4px 0;color:#71717a;">Time</td><td>${alert.timestamp}</td></tr>
          </table>
          <a href="${alert.dashboard}" style="display:inline-block;padding:10px 20px;background:#f3f0eb;color:#191919;text-decoration:none;border-radius:8px;font-weight:600;">Open Dashboard</a>
        </div>
      `,
    });
  } catch (err) {
    console.error("[sendEmail] Resend error:", err);
  }
}

async function sendWebhook(url: string, headers: Record<string, string> | undefined, alert: AlertPayload) {
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(headers ?? {}) },
    body: JSON.stringify(alert),
  });
}

async function sendPagerDuty(integrationKey: string, alert: AlertPayload) {
  await fetch("https://events.pagerduty.com/v2/enqueue", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      routing_key: integrationKey,
      event_action: "trigger",
      payload: {
        summary: `${alert.title}: ${alert.message}`,
        severity: alert.severity === "info" ? "info" : alert.severity === "warning" ? "warning" : "critical",
        source: "sentinel",
        custom_details: { agent: alert.agent, amount: alert.amount, timestamp: alert.timestamp },
      },
      links: [{ href: alert.dashboard, text: "Sentinel Dashboard" }],
    }),
  });
}

async function sendTeams(url: string, alert: AlertPayload) {
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      "@type": "MessageCard",
      themeColor: alert.severity === "critical" ? "EF4444" : alert.severity === "warning" ? "EAB308" : "3B82F6",
      summary: alert.title,
      sections: [{
        activityTitle: alert.title,
        facts: [
          { name: "Agent", value: alert.agent },
          { name: "Amount", value: `$${alert.amount.toFixed(2)}` },
          { name: "Time", value: alert.timestamp },
          { name: "Message", value: alert.message },
        ],
      }],
      potentialAction: [{
        "@type": "OpenUri",
        name: "Open Dashboard",
        targets: [{ os: "default", uri: alert.dashboard }],
      }],
    }),
  });
}
