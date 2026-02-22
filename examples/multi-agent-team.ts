/**
 * Multi-Agent Team Example
 *
 * Three agents share a team budget. Each agent has its own Sentinel-wrapped fetch,
 * but they share a single BudgetManager and AuditLogger for team-level enforcement.
 */

import {
  wrapWithSentinel,
  BudgetManager,
  AuditLogger,
  MemoryStorage,
  SentinelBudgetError,
  customPolicy,
} from "../src/index";
import { SentinelDashboard } from "../src/dashboard/index";

function createMockFetch(amountUsdc: string): typeof fetch {
  return async (): Promise<Response> => {
    const settlement = {
      success: true,
      transaction: "0x" + Math.random().toString(16).slice(2, 18),
      network: "eip155:8453",
      payer: "0xTeamWallet",
    };
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "payment-response": Buffer.from(JSON.stringify(settlement)).toString("base64"),
      },
    });
  };
}

async function main() {
  // Shared team storage — all agents write to the same audit log
  const sharedStorage = new MemoryStorage();

  // Team budget: $10/hour across all agents
  const teamPolicy = customPolicy({
    maxPerCall: "5.00",
    maxPerHour: "10.00",
    maxPerDay: "50.00",
  });

  const agents = ["research-bot-1", "research-bot-2", "research-bot-3"];

  // Create a Sentinel-wrapped fetch for each agent, all sharing the same storage
  const agentFetches = agents.map((agentId) =>
    wrapWithSentinel(createMockFetch("0.50"), {
      agentId,
      team: "research",
      humanSponsor: "bob@company.com",
      budget: teamPolicy,
      audit: {
        enabled: true,
        storage: sharedStorage,
      },
    }),
  );

  console.log("=== Multi-Agent Team Demo ===\n");

  // Each agent makes a few requests
  for (let i = 0; i < agentFetches.length; i++) {
    const agentFetch = agentFetches[i]!;
    const agentId = agents[i]!;

    try {
      console.log(`${agentId}: Making request 1...`);
      await agentFetch(`https://api.research.com/papers?q=topic${i}`);

      console.log(`${agentId}: Making request 2...`);
      await agentFetch(`https://api.research.com/papers?q=topic${i + 10}`);
    } catch (err) {
      if (err instanceof SentinelBudgetError) {
        console.log(`${agentId}: BLOCKED — ${err.message}`);
      } else {
        throw err;
      }
    }
  }

  // Query the shared dashboard
  console.log("\n=== Team Dashboard ===\n");

  const dashboard = new SentinelDashboard({ storage: sharedStorage });

  const agentSummaries = await dashboard.getAgents();
  for (const agent of agentSummaries) {
    console.log(`  ${agent.agentId}: $${agent.totalSpend} (${agent.transactionCount} txns)`);
  }

  const alerts = await dashboard.getAlerts();
  if (alerts.length > 0) {
    console.log(`\n  ${alerts.length} alert(s) detected`);
    for (const alert of alerts) {
      console.log(`    [${alert.type}] ${alert.message}`);
    }
  }
}

main().catch(console.error);
