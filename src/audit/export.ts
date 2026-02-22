import type { AuditRecord, AuditSummary } from "../types/audit";

const CSV_HEADERS: (keyof AuditRecord)[] = [
  "id", "agent_id", "team", "human_sponsor",
  "amount", "amount_raw", "asset", "network", "scheme",
  "tx_hash", "payer_address", "payee_address", "facilitator",
  "endpoint", "method", "status_code", "response_time_ms",
  "policy_id", "policy_evaluation", "budget_remaining",
  "task_id", "session_id",
  "created_at", "settled_at",
];

/** Convert records to a properly escaped CSV string */
export function toCSV(records: AuditRecord[]): string {
  const lines: string[] = [CSV_HEADERS.join(",")];

  for (const record of records) {
    const values = CSV_HEADERS.map((key) => {
      const val = record[key];
      if (val === null || val === undefined) return "";
      const str = String(val);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    });
    lines.push(values.join(","));
  }

  return lines.join("\n") + "\n";
}

/** Convert records to a JSON string */
export function toJSON(records: AuditRecord[], pretty = false): string {
  return JSON.stringify(records, null, pretty ? 2 : undefined);
}

/** Generate a human-readable text summary report */
export function toSummaryReport(summary: AuditSummary): string {
  const lines: string[] = [
    "═══════════════════════════════════════════",
    "  VALEO SENTINEL — AUDIT SUMMARY REPORT",
    "═══════════════════════════════════════════",
    "",
    `  Period: ${new Date(summary.period.start).toISOString()} — ${new Date(summary.period.end).toISOString()}`,
    "",
    `  Total Spend:        $${summary.total_spend}`,
    `  Total Transactions: ${summary.total_transactions}`,
    `  Unique Agents:      ${summary.unique_agents}`,
    `  Unique Endpoints:   ${summary.unique_endpoints}`,
    `  Avg Payment:        $${summary.avg_payment}`,
    `  Max Payment:        $${summary.max_payment}`,
    `  Violations:         ${summary.violations}`,
    "",
  ];

  if (Object.keys(summary.by_agent).length > 0) {
    lines.push("  ── Spend by Agent ──");
    for (const [agent, data] of Object.entries(summary.by_agent)) {
      lines.push(`    ${agent}: $${data.spend} (${data.count} txns)`);
    }
    lines.push("");
  }

  if (Object.keys(summary.by_team).length > 0) {
    lines.push("  ── Spend by Team ──");
    for (const [team, data] of Object.entries(summary.by_team)) {
      lines.push(`    ${team}: $${data.spend} (${data.count} txns)`);
    }
    lines.push("");
  }

  if (Object.keys(summary.by_endpoint).length > 0) {
    lines.push("  ── Spend by Endpoint ──");
    for (const [ep, data] of Object.entries(summary.by_endpoint)) {
      lines.push(`    ${ep}: $${data.spend} (${data.count} txns)`);
    }
    lines.push("");
  }

  lines.push("═══════════════════════════════════════════");
  return lines.join("\n");
}
