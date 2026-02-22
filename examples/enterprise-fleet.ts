/**
 * Enterprise Fleet Example
 *
 * Full enterprise setup demonstrating:
 * - Custom budget policies with approval handler
 * - File-based audit storage (persistent)
 * - Multiple teams with different policies
 * - Anomaly detection hooks
 * - CSV export for finance team
 */

import {
  wrapWithSentinel,
  AuditLogger,
  MemoryStorage,
  SentinelBudgetError,
  customPolicy,
  conservativePolicy,
  liberalPolicy,
} from "../src/index";
import type { SentinelConfig, Anomaly, PaymentContext } from "../src/index";
import { SentinelDashboard } from "../src/dashboard/index";
import { toCSV, toSummaryReport } from "../src/audit/export";

function createMockFetch(): typeof fetch {
  return async (): Promise<Response> => {
    const settlement = {
      success: true,
      transaction: "0x" + Math.random().toString(16).slice(2, 18),
      network: "eip155:8453",
      payer: "0xCorpTreasury",
    };
    return new Response(JSON.stringify({ data: "enterprise-grade" }), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "payment-response": Buffer.from(JSON.stringify(settlement)).toString("base64"),
      },
    });
  };
}

async function main() {
  const sharedStorage = new MemoryStorage();

  // Anomaly handler — in production this would page the on-call
  const onAnomaly = async (anomaly: Anomaly): Promise<void> => {
    console.log(`  [ANOMALY] ${anomaly.severity}: ${anomaly.message}`);
  };

  // Approval handler — in production this would call a Slack bot or approval API
  const approvalHandler = async (context: PaymentContext): Promise<boolean> => {
    console.log(`  [APPROVAL] Request for $${context.amount} to ${context.endpoint}`);
    return context.amount < "50.00";
  };

  // --- Team 1: Data Engineering (conservative) ---
  const dataTeamConfig: SentinelConfig = {
    agentId: "etl-pipeline-001",
    team: "data-engineering",
    humanSponsor: "carol@enterprise.com",
    budget: conservativePolicy(),
    audit: { enabled: true, storage: sharedStorage },
    hooks: { onAnomaly },
    metadata: { department: "engineering", cost_center: "ENG-2024" },
  };

  // --- Team 2: ML Research (liberal) ---
  const mlTeamConfig: SentinelConfig = {
    agentId: "ml-training-agent",
    team: "ml-research",
    humanSponsor: "dave@enterprise.com",
    budget: liberalPolicy(),
    audit: {
      enabled: true,
      storage: sharedStorage,
      enrichment: {
        tagRules: [
          { pattern: ".*openai.*", tags: ["llm", "openai"] },
          { pattern: ".*anthropic.*", tags: ["llm", "anthropic"] },
        ],
        staticTags: ["ml-workload"],
      },
    },
    hooks: { onAnomaly },
    metadata: { department: "research", cost_center: "RES-2024" },
  };

  // --- Team 3: Customer Support (custom with approval) ---
  const supportConfig: SentinelConfig = {
    agentId: "support-bot-001",
    team: "customer-support",
    humanSponsor: "eve@enterprise.com",
    budget: customPolicy({
      maxPerCall: "5.00",
      maxPerHour: "50.00",
      maxPerDay: "200.00",
      requireApproval: {
        above: "25.00",
        handler: approvalHandler,
      },
    }),
    audit: { enabled: true, storage: sharedStorage },
    metadata: { department: "support", cost_center: "SUP-2024" },
  };

  // Create fetches for each team
  const mockFetch = createMockFetch();
  const dataFetch = wrapWithSentinel(mockFetch, dataTeamConfig);
  const mlFetch = wrapWithSentinel(mockFetch, mlTeamConfig);
  const supportFetch = wrapWithSentinel(mockFetch, supportConfig);

  console.log("=== Enterprise Fleet Demo ===\n");

  // Simulate workload
  console.log("--- Data Engineering ---");
  await dataFetch("https://api.databroker.com/v2/market-data");
  await dataFetch("https://api.databroker.com/v2/reference-data");

  console.log("--- ML Research ---");
  await mlFetch("https://api.openai.com/v1/chat/completions");
  await mlFetch("https://api.anthropic.com/v1/messages");

  console.log("--- Customer Support ---");
  await supportFetch("https://api.knowledge.com/v1/search");

  // --- Finance Dashboard ---
  console.log("\n=== Finance Dashboard ===\n");

  const dashboard = new SentinelDashboard({ storage: sharedStorage });

  const companySpend = await dashboard.getSpend({ range: "last_day" });
  console.log(`Total company spend: $${companySpend.totalSpend}`);
  console.log(`Total transactions: ${companySpend.count}`);
  console.log("");

  console.log("By team:");
  const agents = await dashboard.getAgents();
  const teamSpend = new Map<string, { spend: number; agents: string[] }>();
  for (const agent of agents) {
    const team = agent.team ?? "(unassigned)";
    const entry = teamSpend.get(team) ?? { spend: 0, agents: [] };
    entry.agents.push(agent.agentId);
    teamSpend.set(team, entry);
  }
  for (const [team, data] of teamSpend) {
    console.log(`  ${team}: ${data.agents.length} agent(s)`);
  }

  // CSV export for auditors
  console.log("\n--- CSV Export (for auditors) ---");
  const auditLogger = new AuditLogger({ enabled: true, storage: sharedStorage });
  const records = await auditLogger.query({});
  const csv = toCSV(records);
  console.log(`Generated CSV with ${records.length} records (${csv.length} bytes)`);
  console.log("First 200 chars:");
  console.log(csv.slice(0, 200));

  // Summary report
  console.log("\n--- Summary Report ---");
  const summary = await auditLogger.summarize();
  console.log(toSummaryReport(summary));
}

main().catch(console.error);
