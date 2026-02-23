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

## The Problem

AI agents are spending real money autonomously. The [x402 protocol](https://github.com/coinbase/x402) enables internet-native payments, but provides no built-in audit trail, budget controls, or compliance tooling.

- 75% of enterprise leaders say compliance is a blocker for autonomous agent payments (KPMG 2025)
- 61% report fragmented payment logs across agent fleets
- Zero visibility into *which agent* spent *how much* on *what endpoint* and *who approved it*

Sentinel fixes this with a single line of code.

---

## Quick Start

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
import { wrapWithSentinel, standardPolicy } from "@x402sentinel/x402"; // <-- add

const client = new x402Client();
registerExactEvmScheme(client, { signer });
const fetchWithPayment = wrapFetchWithPayment(fetch, client);

const secureFetch = wrapWithSentinel(fetchWithPayment, {   // <-- wrap
  agentId: "agent-weather-001",
  budget: standardPolicy(),
});

const response = await secureFetch("https://api.example.com/paid"); // same API
```

That's it. Same `fetch` interface. Budget enforcement + audit trail included.

### Install

```bash
npm install @x402sentinel/x402
# or
pnpm add @x402sentinel/x402
```

---

## Features

| Feature | Description |
|---------|-------------|
| **Budget Enforcement** | Per-call, hourly, daily, and lifetime spend limits. Blocks before payment. |
| **Spike Detection** | Flags payments that exceed N× the rolling average |
| **Audit Trails** | Every payment logged with agent ID, team, endpoint, tx hash, timing |
| **Endpoint Filtering** | Allowlist/blocklist URL patterns |
| **Approval Workflows** | Require human approval above a threshold |
| **Storage Backends** | In-memory (default), JSONL file, or remote API |
| **Dashboard Queries** | Query spend by agent, team, endpoint, time range |
| **CSV/JSON Export** | Export audit data for compliance reviews |
| **Zero Dependencies** | No runtime deps beyond x402 peer deps |
| **Drop-in Wrapper** | One line change. Remove Sentinel, code works identically. |

---

## Configuration

```ts
const secureFetch = wrapWithSentinel(fetchWithPayment, {
  // Required
  agentId: "agent-weather-001",

  // Optional identity
  team: "data-ops",
  humanSponsor: "alice@company.com",

  // Budget policy
  budget: {
    maxPerCall: "1.00",      // max USDC per single payment
    maxPerHour: "25.00",     // hourly rolling cap
    maxPerDay: "200.00",     // daily rolling cap
    maxTotal: "10000.00",    // lifetime cap
    spikeThreshold: 3.0,     // flag if > 3× rolling average
    allowedEndpoints: ["https://api.trusted.com/*"],
    blockedEndpoints: ["https://api.sketchy.com/*"],
    requireApproval: {
      above: "50.00",
      handler: async (ctx) => await askSlackForApproval(ctx),
    },
  },

  // Audit settings
  audit: {
    enabled: true,
    storage: new MemoryStorage(),  // or FileStorage, ApiStorage
    redactFields: ["secret_key"],
    enrichment: {
      staticTags: ["production"],
      tagRules: [
        { pattern: ".*openai.*", tags: ["llm", "openai"] },
      ],
    },
  },

  // Lifecycle hooks
  hooks: {
    afterPayment: async (record) => { /* log to DataDog */ },
    onBudgetExceeded: async (violation) => { /* page on-call */ },
    onAnomaly: async (anomaly) => { /* alert Slack */ },
  },

  // Custom metadata on every record
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
    // "Budget exceeded: $2.50 spent of $5.00 hourly limit on agent-weather-001"
    console.log(err.violation.type);   // "hourly"
    console.log(err.violation.limit);  // "5.00"
  }
}
```

---

## Audit Records

Every payment produces an `AuditRecord` with:

```ts
{
  id: "a1b2c3d4e5f6g7h8",    // deterministic hash
  agent_id: "agent-weather-001",
  team: "data-ops",
  human_sponsor: "alice@company.com",
  amount: "0.50",              // human-readable USDC
  amount_raw: "500000",        // base units
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

// Remote API — batched writes to api.valeo.money
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
console.log(summary.total_spend);  // "$1,234.56"

const csv = await logger.exportCSV();
```

---

## Dashboard

```ts
import { SentinelDashboard } from "@x402sentinel/x402/dashboard";

const dashboard = new SentinelDashboard({ storage: myStorage });

// Spend reports
const report = await dashboard.getSpend({
  agentId: "bot-1",
  range: "last_day",
});
console.log(report.totalSpend, report.count);

// Agent summaries
const agents = await dashboard.getAgents();

// Alerts (violations + anomalies)
const alerts = await dashboard.getAlerts();
```

Dashboard queries run locally against your storage backend. No remote API required.

---

## Integration Guide

Sentinel wraps **any** x402-compatible fetch. It works with:

- `@x402/fetch` + `x402Client` (current)
- `x402-fetch` + viem wallet (legacy)
- Any function with the `fetch` signature that handles x402 internally

The wrapper never touches the response body. It reads only headers (`PAYMENT-RESPONSE`, `PAYMENT-REQUIRED`) for audit data.

---

## API Reference

### `wrapWithSentinel(fetch, config): typeof fetch`

Wraps an x402 fetch function with Sentinel instrumentation. Returns a drop-in replacement.

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
├── app/                   Next.js 15 application
│   ├── /login             API key authentication
│   ├── /dashboard         Real-time analytics dashboard
│   ├── /docs              Full documentation site
│   └── /api/v1/*          REST API (18 endpoints)
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
- Real-time dashboard at [app.valeo.money](https://app.valeo.money)

---

## License

MIT — see [LICENSE](./LICENSE)
