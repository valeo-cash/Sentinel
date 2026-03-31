# @x402sentinel/router

Your AI agents can now purchase multiple x402 endpoints in a single intent — with one unified, verifiable receipt.

No fragmented payments across providers. Budget enforcement at both per-endpoint and total route level. A single cryptographic proof that covers the entire execution, verifiable by anyone via a public API.

---

## The Problem

When AI agents call multiple paid APIs in a single workflow:

- Payments are fragmented — each endpoint is an isolated transaction with no connection to the others
- Spend is unpredictable — agents discover prices at runtime, and costs vary across providers
- Budgets are hard to enforce — concurrent payments can race past caps without coordination
- There is no unified proof — each payment generates a separate receipt with no link between them
- Enterprises cannot audit the workflow — no single artifact proves what happened, what was paid, and to whom

---

## The Solution

Payment Router is a client-side SDK that orchestrates multi-endpoint x402 payment workflows:

- **Discovery** — probes all endpoints for x402 payment requirements before any money moves
- **Budget enforcement** — validates per-endpoint caps and total USD budget with an async-safe mutex (no race conditions in parallel mode)
- **Execution strategies** — parallel, sequential, or best-effort, depending on the workflow
- **Unified receipt** — generates a single SHA-256 hash covering all sub-payments
- **Server signature** — Sentinel returns an HMAC-SHA256 signature over the receipt hash (no secrets in the client)
- **Public verification** — anyone can verify a receipt via `POST /api/v1/routes/verify`

---

## What It Enables

- Multi-provider x402 pipelines with a single function call
- Budget-capped AI agent workflows with per-endpoint and total spend limits
- Auditable payment execution — every route produces a frozen snapshot of config, discovery, and results
- Shareable proof via `X-Sentinel-Receipt-Hash` header
- Experimental single-transaction multi-leg payments (requires all endpoints on the same network and token)
- Enterprise compliance readiness — receipts, snapshots, and signatures for audit trails

---

## 30-Second Quickstart

```bash
npm install @x402sentinel/router
```

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
    { label: "weather", url: "https://weather.x402.dev/data",  maxUsd: 0.02 },
    { label: "market",  url: "https://market.x402.dev/prices", maxUsd: 0.02 },
  ],
});

console.log(result.receipt.receiptHash);  // SHA-256 unified receipt
console.log(result.receipt.sentinelSig);  // Server HMAC signature
```

---

## Shareable Proof

Every execution produces a receipt hash that can be shared as a single header:

```
X-Sentinel-Receipt-Hash: a1b2c3d4e5f6...
```

Anyone can verify it — no authentication required:

```bash
curl -X POST https://sentinel.valeocash.com/api/v1/routes/verify \
  -H "Content-Type: application/json" \
  -d '{"receiptHash": "a1b2c3...", "sentinelSig": "d4e5f6..."}'
```

```json
{ "verified": true, "routeName": "research-pipeline", "executionId": "rex_..." }
```

Third parties can independently confirm that a payment execution happened, what it cost, and that it was signed by Sentinel.

---

## When To Use This

**Use if you are:**

- Calling 2+ x402 endpoints in a single agent workflow
- Enforcing spend caps per endpoint or per route
- Building production agents that need auditable payment proof
- Operating on Base or any x402-compatible network

**Do not use if you are:**

- Calling a single x402 endpoint (use `@x402sentinel/x402` directly)
- Building without compliance or audit requirements

---

## Works With

| Platform | Package |
|----------|---------|
| Base / x402 endpoints | Native support (Base, Base Sepolia, Ethereum, Polygon, Arbitrum) |
| Express | `@x402sentinel/express` |
| Next.js | `@x402sentinel/next` |
| Vercel AI SDK | `@x402sentinel/vercel-ai` |
| LangChain | `@x402sentinel/langchain` |

---

## Architecture

```
Intent → Discovery → Budget Ledger → Execution Strategy → Unified Receipt → Server Signature
```

1. **Discovery** — concurrent HTTP 402 probes extract price, network, token, and payTo from each endpoint
2. **Budget Ledger** — two-phase accounting (reserved vs. spent) with async mutex for parallel safety
3. **Execution** — calls `paymentFetch` per endpoint, retrieves payment info via `getPaymentInfo()` callback
4. **Receipt** — SHA-256 hash of canonical JSON, with per-payment sub-hashes
5. **Signature** — receipt posted to Sentinel, server returns HMAC-SHA256 (`sentinelSig`)

---

## API Overview

### `new PaymentRouter(options?)`

| Option | Type | Description |
|--------|------|-------------|
| `paymentFetch` | `typeof fetch` | x402 payment-aware fetch function |
| `getPaymentInfo` | `() => PaymentInfo \| null` | Retrieve payment details after each call |
| `agentId` | `string` | Agent identifier for receipt attribution |
| `apiKey` | `string` | Sentinel API key for server signing |
| `parse402` | `(res, body) => DiscoveredPayment \| null` | Custom 402 response parser |
| `resolveToken` | `(address, network) => { symbol, decimals } \| null` | Custom token resolver |

### `router.execute(config)`

Executes a route. Returns `RouteExecutionResult` with results keyed by label, unified receipt, discovery data, and route snapshot.

### `router.discover(config)`

Probes all endpoints without paying. Returns estimated costs, per-endpoint cap validation, and single-tx compatibility.

### Receipt Fields

| Field | Source | Description |
|-------|--------|-------------|
| `receiptHash` | Client | SHA-256 of canonical receipt JSON |
| `sentinelSig` | Server | HMAC-SHA256 over `receiptHash` |
| `subReceiptHashes` | Client | SHA-256 of each sub-payment |

### Payment Modes

| Mode | Description |
|------|-------------|
| `multiTx` | Each endpoint gets its own payment. Default. Most compatible. |
| `singleTx` | One transaction pays all endpoints. Requires same network + token. Experimental. |

---

## Links

- [Sentinel Dashboard](https://sentinel.valeocash.com)
- [Documentation](https://sentinel.valeocash.com/docs)
- [npm: @x402sentinel/x402](https://npmjs.com/package/@x402sentinel/x402)
- [npm: @x402sentinel/test](https://npmjs.com/package/@x402sentinel/test)
- [GitHub](https://github.com/valeo-cash/Sentinel/tree/main/packages/sentinel-router)

## License

MIT
