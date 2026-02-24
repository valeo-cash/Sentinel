import { wrapWithSentinel, ApiStorage } from "@x402sentinel/x402";

// ============================================
// ENTERPRISE CONFIGURATION
// ============================================
// All values should come from environment variables
// in production. Hardcoded here for demonstration.

const config = {
  sentinel: {
    baseUrl: process.env.SENTINEL_URL || "https://sentinel.valeocash.com",
    apiKey: process.env.SENTINEL_API_KEY || "your-api-key",
  },
  agents: [
    {
      id: "compliance-bot",
      budget: {
        maxPerCall: "1.00",
        maxPerHour: "25.00",
        maxPerDay: "200.00",
      },
    },
  ],
};

// ============================================
// SETUP
// ============================================

const storage = new ApiStorage({
  baseUrl: config.sentinel.baseUrl,
  apiKey: config.sentinel.apiKey,
});

const agent = config.agents[0]!;

const fetch = wrapWithSentinel(globalThis.fetch, {
  agentId: agent.id,
  budget: agent.budget,
  audit: { storage },
});

// ============================================
// COMPLIANCE CHECKLIST (for your SOC 2 auditor)
// ============================================
//
// All agent payments logged with full audit trail
// Budget enforcement prevents overspend
// Cryptographic receipts for every payment
// PDF audit reports exportable on demand
// Scheduled reports emailed to finance team
// Slack/PagerDuty alerts on budget violations
// Activity log tracks all admin actions
// Role-based access control (Admin/Viewer)
// Data encrypted in transit (TLS 1.3)
//
// Dashboard: sentinel.valeocash.com/dashboard
// Receipts:  sentinel.valeocash.com/dashboard/receipts
// Reports:   sentinel.valeocash.com/dashboard/settings/reports
// ============================================

async function main() {
  console.log("\u{1F3E2} Enterprise Compliance Agent Starting\n");
  console.log("Agent:", agent.id);
  console.log("Daily limit: $" + agent.budget.maxPerDay);
  console.log("Audit trail: sentinel.valeocash.com/dashboard\n");

  try {
    const res = await fetch("https://api.data-provider.com/enterprise");

    if (res.ok) {
      console.log("\u2713 Payment successful");
      console.log("  Receipt: check sentinel.valeocash.com/dashboard/receipts");
    } else if (res.status === 403) {
      console.log("\u26D4 Payment BLOCKED by budget policy");
      console.log("  Alert sent to configured channels");
    }
  } catch (err: any) {
    console.log("\u2717 Error:", err.message);
  }

  console.log("\n\u{1F4CB} Compliance Setup Checklist:");
  console.log("  1. \u2713 SDK installed with budget policies");
  console.log("  2. \u2192 Set up Slack alerts: /dashboard/integrations");
  console.log("  3. \u2192 Schedule weekly PDF reports: /dashboard/settings/reports");
  console.log("  4. \u2192 Invite finance team: /dashboard/settings");
  console.log("  5. \u2192 Export your first PDF report: /dashboard/settings");
}

main().catch(console.error);
