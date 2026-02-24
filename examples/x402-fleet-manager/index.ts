import { wrapWithSentinel, ApiStorage } from "@x402sentinel/x402";

const SENTINEL_URL = "https://sentinel.valeocash.com";
const API_KEY = process.env.SENTINEL_API_KEY || "anonymous";

// Define 5 agents with different roles and budgets
const agents = [
  {
    id: "researcher-01",
    role: "Research data from paid APIs",
    endpoint: "https://api.data-market.com/research",
    budget: { maxPerCall: "0.10", maxPerHour: "5.00", maxPerDay: "25.00" },
  },
  {
    id: "news-fetcher",
    role: "Fetch latest news articles",
    endpoint: "https://api.news-service.com/latest",
    budget: { maxPerCall: "0.05", maxPerHour: "2.00", maxPerDay: "10.00" },
  },
  {
    id: "price-tracker",
    role: "Track crypto prices",
    endpoint: "https://api.price-feed.com/crypto",
    budget: { maxPerCall: "0.02", maxPerHour: "1.00", maxPerDay: "5.00" },
  },
  {
    id: "content-writer",
    role: "Generate content via paid LLM",
    endpoint: "https://api.llm-service.com/generate",
    budget: { maxPerCall: "0.50", maxPerHour: "10.00", maxPerDay: "50.00" },
  },
  {
    id: "image-gen",
    role: "Generate images via paid API",
    endpoint: "https://api.image-gen.com/create",
    budget: { maxPerCall: "0.25", maxPerHour: "5.00", maxPerDay: "20.00" },
  },
];

async function runAgent(agent: (typeof agents)[0]) {
  const storage = new ApiStorage({ baseUrl: SENTINEL_URL, apiKey: API_KEY });

  const fetch = wrapWithSentinel(globalThis.fetch, {
    agentId: agent.id,
    budget: agent.budget,
    audit: { storage },
  });

  console.log(`\u{1F916} [${agent.id}] Starting \u2014 ${agent.role}`);
  console.log(`   Budget: $${agent.budget.maxPerDay}/day`);

  try {
    const res = await fetch(agent.endpoint);
    if (res.ok) {
      console.log(`\u2713  [${agent.id}] Payment successful`);
    } else if (res.status === 403) {
      console.log(`\u26D4 [${agent.id}] BLOCKED \u2014 budget exceeded`);
    } else {
      console.log(`\u2717  [${agent.id}] Failed: ${res.status}`);
    }
  } catch (err: any) {
    console.log(`\u2717  [${agent.id}] Error: ${err.message}`);
  }
}

async function main() {
  console.log("\u{1F680} Fleet Manager Starting \u2014 5 Agents\n");
  console.log("\u2501".repeat(50));

  // Run all agents concurrently
  await Promise.allSettled(agents.map(runAgent));

  console.log("\n" + "\u2501".repeat(50));
  console.log("\n\u{1F4CA} All payments tracked by Sentinel");
  console.log("   Dashboard: https://sentinel.valeocash.com");
  console.log("   Total daily budget: $110.00");
  console.log("\n\u{1F4A1} Set up Slack alerts at:");
  console.log("   sentinel.valeocash.com/dashboard/integrations\n");
}

main().catch(console.error);
