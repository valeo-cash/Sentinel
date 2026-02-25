# @x402sentinel/router

**x402 Payment Router** — Purchase multi-provider x402 routes with one intent and one unified receipt.

A new primitive for AI agent payments. Your agents call multiple paid APIs in a single operation. Sentinel routes the payments, enforces budget caps, and generates a cryptographically verifiable unified receipt.

## Install
```bash
npm install @x402sentinel/router
```

## Quick Start
```typescript
import { PaymentRouter } from "@x402sentinel/router";

const router = new PaymentRouter({
  paymentFetch: x402Fetch,
  getPaymentInfo: () => x402Fetch.getLastPayment?.() ?? null,
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

// Access results by label
const weather = result.results.weather.data;
const market = result.results.market.data;

// Unified receipt (server-signed)
console.log(result.receipt.receiptHash);   // SHA-256
console.log(result.receipt.sentinelSig);   // Server HMAC
```

## How It Works
Agent Intent
│
▼
┌─────────────┐
│  Discovery   │  Probe all endpoints for x402 prices
└──────┬──────┘
       ▼
┌─────────────┐
│   Budget     │  Validate total + per-endpoint caps
│   Check      │  Reserve budget with async mutex
└──────┬──────┘
       ▼
┌─────────────┐
│  Execute     │  Pay each endpoint (multiTx default)
│  Strategy    │  parallel / sequential / best-effort
└──────┬──────┘
       ▼
┌─────────────┐
│  Unified     │  SHA-256 hash + server-signed HMAC
│  Receipt     │  Covers all sub-payments
└─────────────┘

## Features

### Budget as Caps (Not Splits)

x402 endpoints have fixed prices. The router pays whatever each endpoint requires and validates against caps — not percentage splits.
```typescript
{
  maxBudgetUsd: "$0.10",
  endpoints: [
    { label: "api-a", url: "...", maxUsd: 0.05 },
    { label: "api-b", url: "...", maxUsd: 0.05 },
  ],
}
```

### Payment Modes

- `multiTx` (default) — each endpoint gets its own payment (most compatible)
- `singleTx` (experimental) — one tx pays all (requires same network + token)

### Execution Strategies

- `parallel` — all at once (fastest)
- `sequential` — in order by weight, stop on required failure
- `best-effort` — all at once, succeed if any works

### Cryptographic Receipts

Every execution produces a unified receipt with:
- `receiptHash` — SHA-256 computed client-side
- `sentinelSig` — HMAC-SHA256 computed server-side (no secrets in client)
- `subReceiptHashes[]` — links to individual payment proofs

Verify any receipt via the public API:
```bash
curl -X POST https://sentinel.valeocash.com/api/v1/routes/verify \
  -H "Content-Type: application/json" \
  -d '{"receiptHash": "abc...", "sentinelSig": "def..."}'
```

### Pre-flight Discovery
```typescript
const estimate = await router.discover({
  name: "research-pipeline",
  maxBudgetUsd: "$0.10",
  endpoints: [
    { label: "weather", url: "https://weather.x402.dev/data", maxUsd: 0.05 },
    { label: "market",  url: "https://market.x402.dev/prices", maxUsd: 0.05 },
  ],
});

console.log(estimate.estimatedTotalUsd);
console.log(estimate.withinTotalBudget);
console.log(estimate.singleTxCompatible);
```

### Shareable Proof

Every execution sets `X-Sentinel-Receipt-Hash`. Share it as one-line proof of payment:
X-Sentinel-Receipt-Hash: a1b2c3d4e5f6...

## Dashboard

Manage routes visually at sentinel.valeocash.com/dashboard/routes — create routes, discover costs, view execution history, copy SDK snippets.

## License

MIT
