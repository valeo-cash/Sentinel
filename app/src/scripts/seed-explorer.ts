import { createHash } from "node:crypto";
import { nanoid } from "nanoid";
import { db } from "../db/client";
import { agents, payments, teams } from "../db/schema";

const TEAMS = [
  { name: "Valeo Demo", plan: "pro", key: "sk_sentinel_demo_000" },
  { name: "Acme AI Labs", plan: "pro", key: "sk_sentinel_acme_001" },
  { name: "DeepQuery Inc", plan: "enterprise", key: "sk_sentinel_deep_002" },
];

const ENDPOINTS = [
  { domain: "api.openai.com", path: "/v1/chat/completions", category: "llm-inference" },
  { domain: "api.anthropic.com", path: "/v1/messages", category: "llm-inference" },
  { domain: "api.together.xyz", path: "/v1/completions", category: "llm-inference" },
  { domain: "weather.x402.org", path: "/forecast", category: "data-fetch" },
  { domain: "data-api.dexter.cash", path: "/v2/market/prices", category: "data-fetch" },
  { domain: "api.coingecko.com", path: "/api/v3/simple/price", category: "data-fetch" },
  { domain: "compute.x402.org", path: "/run", category: "compute" },
  { domain: "gpu.lambda.cloud", path: "/v1/inference", category: "compute" },
  { domain: "storage.x402.org", path: "/upload", category: "storage" },
  { domain: "api.etherscan.io", path: "/api", category: "data-fetch" },
  { domain: "api.groq.com", path: "/v1/chat/completions", category: "llm-inference" },
  { domain: "api.perplexity.ai", path: "/chat/completions", category: "llm-inference" },
];

const AGENT_DEFS = [
  { externalId: "researcher-01", name: "Research Agent" },
  { externalId: "writer-02", name: "Content Writer" },
  { externalId: "data-fetcher-03", name: "Data Fetcher" },
  { externalId: "trader-04", name: "Trading Bot" },
  { externalId: "monitor-05", name: "Health Monitor" },
  { externalId: "summarizer-06", name: "Summarizer" },
  { externalId: "coder-07", name: "Code Assistant" },
  { externalId: "analyst-08", name: "Market Analyst" },
];

const NETWORKS = [
  "eip155:8453",
  "eip155:84532",
  "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
  "eip155:1",
  "eip155:42161",
];
const NETWORK_WEIGHTS = [0.45, 0.25, 0.20, 0.05, 0.05];

const STATUSES = ["paid", "failed", "blocked", "unpaid"] as const;
const STATUS_WEIGHTS = [0.92, 0.03, 0.03, 0.02];

function weightedRandom<T>(items: readonly T[], weights: number[]): T {
  const r = Math.random();
  let acc = 0;
  for (let i = 0; i < items.length; i++) {
    acc += weights[i]!;
    if (r < acc) return items[i]!;
  }
  return items[items.length - 1]!;
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

async function seed() {
  console.log("Seeding explorer data...");

  const teamIds: string[] = [];
  for (const t of TEAMS) {
    const id = `team_${nanoid(16)}`;
    const hash = createHash("sha256").update(t.key).digest("hex");
    const now = new Date();
    await db.insert(teams).values({
      id,
      name: t.name,
      plan: t.plan,
      apiKeyHash: hash,
      createdAt: now,
      updatedAt: now,
    }).onConflictDoNothing();
    teamIds.push(id);
    console.log(`  Team: ${t.name} (${id})`);
  }

  const agentIds: { id: string; teamId: string }[] = [];
  for (let i = 0; i < AGENT_DEFS.length; i++) {
    const def = AGENT_DEFS[i]!;
    const teamId = teamIds[i % teamIds.length]!;
    const id = `agent_${nanoid(16)}`;
    const now = new Date();
    await db.insert(agents).values({
      id,
      teamId,
      externalId: def.externalId,
      name: def.name,
      firstSeenAt: now,
      lastSeenAt: now,
    }).onConflictDoNothing();
    agentIds.push({ id, teamId });
    console.log(`  Agent: ${def.externalId} → ${teamId}`);
  }

  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  let inserted = 0;

  const BATCH_SIZE = 50;
  const TOTAL = 500;
  const batch: (typeof payments.$inferInsert)[] = [];

  for (let i = 0; i < TOTAL; i++) {
    const agent = agentIds[Math.floor(Math.random() * agentIds.length)]!;
    const endpoint = ENDPOINTS[Math.floor(Math.random() * ENDPOINTS.length)]!;
    const network = weightedRandom(NETWORKS, NETWORK_WEIGHTS);
    const status = weightedRandom(STATUSES, STATUS_WEIGHTS);
    const amountUsd = Number(randomBetween(0.01, 5.0).toFixed(4));
    const amountBase = Math.round(amountUsd * 1_000_000).toString();
    const latency = Math.round(randomBetween(50, 3000));
    const tsOffset = Math.floor(Math.random() * thirtyDaysMs);
    const ts = new Date(now - tsOffset);

    batch.push({
      id: `pay_${nanoid(16)}`,
      teamId: agent.teamId,
      agentId: agent.id,
      url: `https://${endpoint.domain}${endpoint.path}`,
      method: Math.random() > 0.3 ? "POST" : "GET",
      endpointDomain: endpoint.domain,
      status,
      amount: amountBase,
      amountUsd,
      asset: "USDC",
      network,
      txHash: status === "paid" ? `0x${nanoid(64)}` : null,
      scheme: "exact",
      payTo: `0x${nanoid(40)}`,
      category: endpoint.category,
      description: `${endpoint.category} call to ${endpoint.domain}`,
      responseTimeMs: latency,
      timestamp: ts.toISOString(),
      createdAt: ts,
    });

    if (batch.length >= BATCH_SIZE) {
      await db.insert(payments).values(batch).onConflictDoNothing();
      inserted += batch.length;
      batch.length = 0;
    }
  }

  if (batch.length > 0) {
    await db.insert(payments).values(batch).onConflictDoNothing();
    inserted += batch.length;
  }

  console.log(`  Inserted ${inserted} payments across ${ENDPOINTS.length} endpoints`);
  console.log("Explorer seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
