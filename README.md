<p align="center">
  <img src="https://sentinel.valeocash.com/sentinel_logo.png" width="80" />
</p>

<p align="center">
  <strong>@x402sentinel/x402</strong><br/>
  Enterprise audit & compliance layer for x402 AI agent payments.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@x402sentinel/x402">
    <img src="https://img.shields.io/npm/v/@x402sentinel/x402?color=red" alt="npm" />
  </a>
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT" />
  </a>
  <img src="https://img.shields.io/badge/x402-compatible-blue" alt="x402 compatible" />
  <img src="https://img.shields.io/badge/tests-89%20passing-brightgreen" alt="89 tests passing" />
</p>

---

**One line to add. Zero config to start.**

## Quick Start

```bash
npm install @x402sentinel/x402
```

```typescript
import { sentinel } from "@x402sentinel/x402";

const fetch = sentinel(globalThis.fetch);

// That's it. Every x402 payment is now tracked.
// View your data: sentinel.valeocash.com
```

### With options (optional)

```typescript
const fetch = sentinel(globalThis.fetch, {
  agentId: "my-agent",
  apiKey: "your-api-key",  // from sentinel.valeocash.com/dashboard/settings
});
```

---

## Framework Packages

One-liner integrations for popular frameworks:

| Package | Install |
|---------|---------|
| **Express** | `npm install @x402sentinel/express` |
| **Next.js** | `npm install @x402sentinel/next` |
| **LangChain** | `npm install @x402sentinel/langchain` |
| **Vercel AI SDK** | `npm install @x402sentinel/vercel-ai` |

### Express

```typescript
import express from "express";
import { sentinelMiddleware } from "@x402sentinel/express";

const app = express();
app.use(sentinelMiddleware());

app.get("/data", async (req, res) => {
  const data = await req.sentinelFetch("https://api.example.com/paid");
  res.json(await data.json());
});
```

### Next.js

```typescript
// app/api/data/route.ts
import { withSentinel } from "@x402sentinel/next";

export const GET = withSentinel(async (req, sentinelFetch) => {
  const res = await sentinelFetch("https://api.example.com/paid");
  return Response.json(await res.json());
});
```

### LangChain

```typescript
import { SentinelX402Tool } from "@x402sentinel/langchain";

const tools = [new SentinelX402Tool({ agentId: "research-agent" })];
```

### Vercel AI SDK

```typescript
import { sentinelX402Tool } from "@x402sentinel/vercel-ai";

const result = await generateText({
  model: openai("gpt-4"),
  tools: { x402: sentinelX402Tool({ agentId: "my-agent" }) },
  prompt: "Fetch the latest weather data",
});
```

---

## Examples

| Repo | Description | Difficulty |
|------|-------------|------------|
| [x402-agent-starter](https://github.com/valeo-cash/x402-agent-starter) | Simplest x402 agent — 25 lines | Beginner |
| [x402-fleet-manager](https://github.com/valeo-cash/x402-fleet-manager) | 5 agents with budget controls | Intermediate |
| [x402-enterprise-compliance](https://github.com/valeo-cash/x402-enterprise-compliance) | Production compliance + SOC 2 | Advanced |
| [x402-nextjs-saas](https://github.com/valeo-cash/x402-nextjs-saas) | Next.js SaaS with x402 payments | Intermediate |
| [x402-langchain-agent](https://github.com/valeo-cash/x402-langchain-agent) | LangChain research agent | Intermediate |

---

## Test Any x402 Endpoint

```bash
npx @x402sentinel/test https://api.example.com/endpoint
```

Tests any x402 payment endpoint and scores it 0-10:
- Endpoint reachability
- HTTP 402 response validation
- Payment schema check
- Security headers
- Response time

[npmjs.com/package/@x402sentinel/test](https://npmjs.com/package/@x402sentinel/test)

---

## The Problem

AI agents are spending real money autonomously. The [x402 protocol](https://github.com/coinbase/x402) enables internet-native payments, but provides no built-in audit trail, budget controls, or compliance tooling.

- 75% of enterprise leaders say compliance is a blocker for autonomous agent payments (KPMG 2025)
- 61% report fragmented payment logs across agent fleets
- Zero visibility into *which agent* spent *how much* on *what endpoint* and *who approved it*

Sentinel fixes this with a single line of code.

---

## Features

| Feature | Description |
|---------|-------------|
| **Budget Enforcement** | Per-call, hourly, daily, and lifetime spend limits. Blocks before payment. |
| **Spike Detection** | Flags payments that exceed N x the rolling average |
| **Audit Trails** | Every payment logged with agent ID, team, endpoint, tx hash, timing |
| **Cryptographic Receipts** | HMAC-SHA256 signed proof for every payment |
| **Endpoint Filtering** | Allowlist/blocklist URL patterns |
| **Approval Workflows** | Require human approval above a threshold |
| **Storage Backends** | In-memory (default), JSONL file, or remote API |
| **Dashboard Queries** | Query spend by agent, team, endpoint, time range |
| **CSV/JSON Export** | Export audit data for compliance reviews |
| **Zero Config** | Works with no API key. Claim your data later. |
| **Drop-in Wrapper** | One line change. Remove Sentinel, code works identically. |

---

## Advanced Configuration

For full control, use `wrapWithSentinel` directly:

### Before (plain x402)

```ts
import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { registerExactEvmScheme } from "@x402/evm/exact/client";

const client = new x402Client();
registerExactEvmScheme(client, { signer });
const fetchWithPayment = wrapFetchWithPayment(fetch, client);

const response = await fetchWithPayment("https://api.example.com/paid");
```

### After (with Sentinel)

```ts
import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { wrapWithSentinel, standardPolicy } from "@x402sentinel/x402";

const client = new x402Client();
registerExactEvmScheme(client, { signer });
const fetchWithPayment = wrapFetchWithPayment(fetch, client);

const secureFetch = wrapWithSentinel(fetchWithPayment, {
  agentId: "agent-weather-001",
  budget: standardPolicy(),
});

const response = await secureFetch("https://api.example.com/paid");
```

### Full Configuration

```ts
const secureFetch = wrapWithSentinel(fetchWithPayment, {
  agentId: "agent-weather-001",
  team: "data-ops",
  humanSponsor: "alice@company.com",

  budget: {
    maxPerCall: "1.00",
    maxPerHour: "25.00",
    maxPerDay: "200.00",
    maxTotal: "10000.00",
    spikeThreshold: 3.0,
    allowedEndpoints: ["https://api.trusted.com/*"],
    blockedEndpoints: ["https://api.sketchy.com/*"],
    requireApproval: {
      above: "50.00",
      handler: async (ctx) => await askSlackForApproval(ctx),
    },
  },

  audit: {
    enabled: true,
    storage: new MemoryStorage(),
    redactFields: ["secret_key"],
    enrichment: {
      staticTags: ["production"],
      tagRules: [
        { pattern: ".*openai.*", tags: ["llm", "openai"] },
      ],
    },
  },

  hooks: {
    afterPayment: async (record) => { /* log to DataDog */ },
    onBudgetExceeded: async (violation) => { /* page on-call */ },
    onAnomaly: async (anomaly) => { /* alert Slack */ },
  },

  metadata: { environment: "production", cost_center: "ENG-2024" },
});
```

---

## Budget Policies

### Presets

```ts
import {
  conservativePolicy,  // $0.10/call, $5/hr, $50/day
  standardPolicy,      // $1.00/call, $25/hr, $200/day
  liberalPolicy,       // $10/call, $100/hr, $1000/day
  unlimitedPolicy,     // no limits (audit only)
  customPolicy,        // override any defaults
} from "@x402sentinel/x402";
```

| Preset | Per Call | Per Hour | Per Day |
|--------|---------|---------|---------|
| `conservativePolicy()` | $0.10 | $5.00 | $50.00 |
| `standardPolicy()` | $1.00 | $25.00 | $200.00 |
| `liberalPolicy()` | $10.00 | $100.00 | $1,000.00 |
| `unlimitedPolicy()` | -- | -- | -- |

### Custom Policy

```ts
const policy = customPolicy({
  maxPerCall: "5.00",
  maxPerHour: "50.00",
  spikeThreshold: 5.0,
  blockedEndpoints: ["https://*.competitors.com/*"],
});
```

### Error Handling

```ts
import { SentinelBudgetError } from "@x402sentinel/x402";

try {
  await secureFetch("https://api.example.com/expensive");
} catch (err) {
  if (err instanceof SentinelBudgetError) {
    console.log(err.message);
    console.log(err.violation.type);
    console.log(err.violation.limit);
  }
}
```

---

## Audit Records

Every payment produces an `AuditRecord` with:

```ts
{
  id: "a1b2c3d4e5f6g7h8",
  agent_id: "agent-weather-001",
  team: "data-ops",
  human_sponsor: "alice@company.com",
  amount: "0.50",
  amount_raw: "500000",
  asset: "USDC",
  network: "eip155:8453",
  tx_hash: "0xabc...",
  endpoint: "https://api.weather.com/v1/current",
  method: "GET",
  status_code: 200,
  response_time_ms: 150,
  policy_evaluation: "allowed",
  budget_remaining: "24.50",
  created_at: 1700000000000,
  tags: ["production", "weather"],
  metadata: { cost_center: "ENG-2024" },
}
```

### Storage Backends

```ts
import { MemoryStorage, FileStorage, ApiStorage } from "@x402sentinel/x402";

// In-memory (default) — 10k records, FIFO eviction
const memory = new MemoryStorage(10_000);

// JSONL file — persistent, append-only
const file = new FileStorage(".valeo/audit.jsonl");

// Remote API — batched writes to sentinel.valeocash.com
const api = new ApiStorage({ apiKey: "val_..." });
```

### Querying

```ts
import { AuditLogger } from "@x402sentinel/x402";

const logger = new AuditLogger({ storage: memory });

const records = await logger.query({
  agentId: "agent-weather-001",
  startTime: Date.now() - 86400000,
  status: ["allowed", "flagged"],
  limit: 100,
});

const summary = await logger.summarize({ team: "data-ops" });
console.log(summary.total_spend);

const csv = await logger.exportCSV();
```

---

## Dashboard

```ts
import { SentinelDashboard } from "@x402sentinel/x402/dashboard";

const dashboard = new SentinelDashboard({ storage: myStorage });

const report = await dashboard.getSpend({ agentId: "bot-1", range: "last_day" });
const agents = await dashboard.getAgents();
const alerts = await dashboard.getAlerts();
```

Dashboard queries run locally against your storage backend. No remote API required.

---

## API Reference

### `sentinel(fetch, options?): typeof fetch`

Zero-config wrapper. Works with no API key. Call `sentinel(globalThis.fetch)` and every x402 payment is tracked.

### `wrapWithSentinel(fetch, config): typeof fetch`

Full-config wrapper with budget enforcement, audit trails, hooks, and metadata.

### `BudgetManager`

```ts
class BudgetManager {
  constructor(policy: BudgetPolicy);
  evaluate(context: PaymentContext): BudgetEvaluation;
  record(amount: string, endpoint: string): void;
  getState(): BudgetState;
  reset(scope: 'hourly' | 'daily' | 'total'): void;
  serialize(): string;
  static deserialize(data: string, policy: BudgetPolicy): BudgetManager;
}
```

### `AuditLogger`

```ts
class AuditLogger {
  constructor(config?: AuditConfig);
  log(record): Promise<AuditRecord>;
  logBlocked(context, violation): Promise<AuditRecord>;
  query(query: AuditQuery): Promise<AuditRecord[]>;
  summarize(query?): Promise<AuditSummary>;
  exportCSV(query?): Promise<string>;
  exportJSON(query?): Promise<string>;
  flush(): Promise<void>;
}
```

### Error Classes

| Class | When | Fatal? |
|-------|------|--------|
| `SentinelBudgetError` | Budget limit exceeded | Yes (blocks payment) |
| `SentinelAuditError` | Audit write failed | No (never blocks) |
| `SentinelConfigError` | Invalid configuration | Yes (at init) |

---

## Full Stack Product

Sentinel is an SDK + Dashboard + API + Docs in a single monorepo:

```
├── /                      SDK (@x402sentinel/x402)
├── packages/              Framework integrations
│   ├── express/           @x402sentinel/express
│   ├── next/              @x402sentinel/next
│   ├── langchain/         @x402sentinel/langchain
│   └── vercel-ai/         @x402sentinel/vercel-ai
├── app/                   Next.js 15 application
│   ├── /login             API key authentication
│   ├── /dashboard         Real-time analytics dashboard
│   ├── /docs              Full documentation site
│   └── /api/v1/*          REST API (20+ endpoints)
├── Dockerfile             Production Docker image
└── docker-compose.yml     One-command deployment
```

### Quick Deploy

```bash
docker compose up --build -d
```

### Development

```bash
pnpm install
make seed    # Populate demo data (500 payments)
make dev     # Start dashboard at localhost:3000
```

Login with demo API key: `sk_sentinel_demo_000`

### Available Make Commands

| Command | Description |
|---------|-------------|
| `make dev` | Start Next.js dev server |
| `make build` | Build SDK + app |
| `make test` | Run SDK tests |
| `make seed` | Seed demo data |
| `make docker-up` | Build & start Docker |
| `make docker-down` | Stop Docker |

---

## Roadmap

- Multi-agent budget coordination (shared team budgets)
- Escrow and pre-commitment flows
- Treasury management integration
- On-chain agent identity verification
- Real-time dashboard at [sentinel.valeocash.com](https://sentinel.valeocash.com)

---

## Payment Router

A new primitive for x402 payments. AI agents can purchase multi-provider routes — one intent, one receipt.
```bash
npm install @x402sentinel/router
```
```typescript
import { PaymentRouter } from "@x402sentinel/router";

const router = new PaymentRouter({
  paymentFetch: x402Fetch,
  agentId: "research-agent-01",
  apiKey: "sk_...",
});

const result = await router.execute({
  name: "research-pipeline",
  maxBudgetUsd: "$0.05",
  strategy: "parallel",
  endpoints: [
    { label: "weather",   url: "https://weather.x402.dev/data",  maxUsd: 0.02 },
    { label: "market",    url: "https://market.x402.dev/prices", maxUsd: 0.02 },
    { label: "sentiment", url: "https://news.x402.dev/score",    maxUsd: 0.01 },
  ],
});

console.log(result.receipt.receiptHash);  // Unified SHA-256
console.log(result.receipt.sentinelSig);  // Server HMAC
```

**Features:**
- Budget caps (not splits) — pays actual x402 prices, validates against per-endpoint and total caps
- Three strategies: parallel, sequential, best-effort
- Cryptographic unified receipts with public verification endpoint
- Pre-flight cost discovery
- Dashboard route builder at `/dashboard/routes`

See [packages/sentinel-router](./packages/sentinel-router) for full documentation.

---

## License

MIT — see [LICENSE](./LICENSE)
