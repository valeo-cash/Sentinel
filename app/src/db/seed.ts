import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "./client";
import { agents, alerts, budgetPolicies, payments, teams } from "./schema";

const API_KEY = "sk_sentinel_demo_000";
const API_KEY_HASH = createHash("sha256").update(API_KEY).digest("hex");

const ENDPOINT_DOMAINS = [
  "api.openai.com",
  "api.anthropic.com",
  "api.cohere.ai",
  "api.together.xyz",
  "api.mistral.ai",
  "api.groq.com",
  "api.perplexity.ai",
  "api.cloudflare.com",
  "api.aws.amazon.com",
  "api.google.com",
  "api.vercel.com",
  "api.stripe.com",
  "api.etherscan.io",
  "api.alchemy.com",
  "api.infura.io",
];

const CATEGORIES = [
  "llm-inference",
  "data-fetch",
  "compute",
  "storage",
] as const;
const CATEGORY_WEIGHTS = [0.4, 0.3, 0.2, 0.1];

const NETWORKS = [
  "eip155:8453",
  "eip155:84532",
  "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
] as const;
const NETWORK_WEIGHTS = [0.6, 0.3, 0.1];

const STATUSES = ["paid", "failed", "blocked", "unpaid"] as const;
const STATUS_WEIGHTS = [0.85, 0.05, 0.07, 0.03];

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

function weightedRandom<T>(items: readonly T[], weights: number[]): T {
  const r = Math.random();
  let acc = 0;
  for (let i = 0; i < weights.length; i++) {
    acc += weights[i]!;
    if (r < acc) return items[i]!;
  }
  return items[items.length - 1]!;
}

/** Box-Muller transform for normal distribution */
function normalRandom(mean: number, stdDev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + stdDev * z;
}

function randomDate(daysAgo: number): Date {
  const now = Date.now();
  const msAgo = daysAgo * 24 * 60 * 60 * 1000;
  return new Date(now - Math.random() * msAgo);
}

function formatISO(date: Date): string {
  return date.toISOString();
}

async function main() {
  // Check if team already exists
  const existingTeam = await db
    .select()
    .from(teams)
    .where(eq(teams.name, "Valeo Demo"))
    .limit(1);

  if (existingTeam.length > 0) {
    console.log("Team 'Valeo Demo' already exists. Skipping seed.");
    return;
  }

  const now = new Date();
  const teamId = `team_${nanoid()}`;

  // 1. Create team
  await db.insert(teams).values({
    id: teamId,
    name: "Valeo Demo",
    plan: "pro",
    apiKeyHash: API_KEY_HASH,
    createdAt: now,
    updatedAt: now,
  });
  console.log("Created team: Valeo Demo");

  // 2. Create 5 agents
  const agentNames = [
    "researcher",
    "writer",
    "data-fetcher",
    "monitor",
    "trader",
  ];
  const agentRecords: { id: string; externalId: string }[] = [];

  for (const name of agentNames) {
    const id = `agent_${nanoid()}`;
    const firstSeen = randomDate(35);
    const lastSeen = randomDate(2);

    await db.insert(agents).values({
      id,
      teamId,
      externalId: name,
      name: name.charAt(0).toUpperCase() + name.slice(1),
      authorizedBy: "demo@valeo.io",
      firstSeenAt: firstSeen,
      lastSeenAt: lastSeen,
      metadata: { source: "seed" },
    });
    agentRecords.push({ id, externalId: name });
  }
  console.log(`Created ${agentRecords.length} agents`);

  // 3. Create 500 payment records
  const paymentRecords: { id: string }[] = [];
  const PAYMENT_COUNT = 500;

  for (let i = 0; i < PAYMENT_COUNT; i++) {
    const agent = agentRecords[Math.floor(Math.random() * agentRecords.length)]!;
    const status = weightedRandom(STATUSES, STATUS_WEIGHTS);
    const category = weightedRandom(CATEGORIES, CATEGORY_WEIGHTS);
    const network = weightedRandom(NETWORKS, NETWORK_WEIGHTS);
    const domain =
      ENDPOINT_DOMAINS[Math.floor(Math.random() * ENDPOINT_DOMAINS.length)];
    const method = METHODS[Math.floor(Math.random() * METHODS.length)];

    // Amount: normal distribution around $0.05, range $0.001 to $0.50
    let amountUsd = normalRandom(0.05, 0.03);
    amountUsd = Math.max(0.001, Math.min(0.5, amountUsd));

    const timestamp = randomDate(30);
    const createdAt = new Date(timestamp.getTime() + 100);

    // Some budget violations and price spikes for alert demo
    const isBudgetViolation = Math.random() < 0.03;
    const isPriceSpike = Math.random() < 0.02;

    const paymentId = `pay_${nanoid()}`;
    await db.insert(payments).values({
      id: paymentId,
      teamId,
      agentId: agent.id,
      url: `https://${domain}/v1/chat/completions`,
      method,
      endpointDomain: domain,
      status,
      amount: Math.round(amountUsd * 1_000_000).toString(),
      amountUsd,
      asset: "USDC",
      network,
      txHash: status === "paid" ? `0x${nanoid(64)}` : null,
      scheme: "x402",
      payTo: `0x${nanoid(40)}`,
      taskId: `task_${nanoid()}`,
      category,
      description: `${category} request`,
      tags: ["demo", "seed"],
      budgetEvaluation: isBudgetViolation ? "exceeded" : "within",
      budgetViolation: isBudgetViolation ? "limit_exceeded" : null,
      budgetUtilization: isBudgetViolation ? 1.15 : 0.6 + Math.random() * 0.3,
      budgetSpent: "125000",
      budgetLimit: "100000",
      responseTimeMs: 50 + Math.floor(Math.random() * 200),
      timestamp: formatISO(timestamp),
      createdAt,
    });
    paymentRecords.push({ id: paymentId });
  }
  console.log(`Created ${PAYMENT_COUNT} payment records`);

  // 4. Create budget policies
  await db.insert(budgetPolicies).values([
    {
      id: `policy_${nanoid()}`,
      teamId,
      agentExternalId: null,
      name: "Team-wide daily limit",
      policy: { type: "daily", limitUsd: 100, window: "24h" },
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: `policy_${nanoid()}`,
      teamId,
      agentExternalId: "trader",
      name: "Trader per-request cap",
      policy: { type: "per_request", limitUsd: 1 },
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ]);
  console.log("Created 2 budget policies");

  // 5. Create alerts
  const failedPayments = paymentRecords.slice(0, 5);
  const blockedPayments = paymentRecords.slice(5, 10);

  const alertValues = [
    {
      id: `alert_${nanoid()}`,
      teamId,
      agentId: agentRecords[0]!.id,
      paymentId: null,
      type: "budget_exceeded",
      severity: "critical",
      message: "Daily budget limit exceeded for team",
      metadata: { limit: 100, spent: 115 },
      resolved: false,
      createdAt: now,
    },
    {
      id: `alert_${nanoid()}`,
      teamId,
      agentId: agentRecords[4]!.id,
      paymentId: failedPayments[0]!.id,
      type: "price_spike",
      severity: "warning",
      message: "Unusual price spike detected for trader agent",
      metadata: { threshold: 0.1, actual: 0.25 },
      resolved: false,
      createdAt: now,
    },
    {
      id: `alert_${nanoid()}`,
      teamId,
      agentId: agentRecords[2]!.id,
      paymentId: blockedPayments[0]!.id,
      type: "endpoint_blocked",
      severity: "warning",
      message: "Endpoint api.example.com blocked by policy",
      metadata: { domain: "api.example.com" },
      resolved: true,
      createdAt: randomDate(5),
    },
    {
      id: `alert_${nanoid()}`,
      teamId,
      agentId: null,
      paymentId: null,
      type: "anomaly",
      severity: "info",
      message: "Unusual request pattern detected",
      metadata: { pattern: "burst" },
      resolved: false,
      createdAt: now,
    },
  ];

  for (const a of alertValues) {
    await db.insert(alerts).values(a);
  }
  console.log(`Created ${alertValues.length} alerts`);

  // Summary
  const teamCount = await db.select().from(teams);
  const agentCount = await db.select().from(agents);
  const paymentCount = await db.select().from(payments);
  const policyCount = await db.select().from(budgetPolicies);
  const alertCount = await db.select().from(alerts);

  console.log("\n--- Seed Summary ---");
  console.log(`Teams: ${teamCount.length}`);
  console.log(`Agents: ${agentCount.length}`);
  console.log(`Payments: ${paymentCount.length}`);
  console.log(`Budget Policies: ${policyCount.length}`);
  console.log(`Alerts: ${alertCount.length}`);
  console.log("\nDemo API key: sk_sentinel_demo_000");
  console.log("(SHA-256 hash stored in database)");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
