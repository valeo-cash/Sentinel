# x402 Agent Starter

The simplest x402 agent with full audit trails.
30 seconds to run.

## Quick Start

```bash
git clone https://github.com/valeo-cash/x402-agent-starter
cd x402-agent-starter
npm install
npm start
```

That's it. Your agent makes x402 payments and every
transaction is tracked by [Sentinel](https://sentinel.valeocash.com).

## What happens

1. Agent calls a paid x402 endpoint
2. Payment is signed and settled on-chain
3. Sentinel logs everything — agent, endpoint, amount,
   tx hash, timestamp
4. View your data at sentinel.valeocash.com

## Add your API key (optional)

```typescript
const fetch = sentinel(globalThis.fetch, {
  agentId: "my-agent",
  apiKey: "your-key-from-sentinel-dashboard",
});
```

## Links

- [Sentinel Dashboard](https://sentinel.valeocash.com)
- [SDK on npm](https://npmjs.com/package/@x402sentinel/x402)
- [Docs](https://sentinel.valeocash.com/docs)

---
Powered by [Sentinel](https://sentinel.valeocash.com) —
the audit layer for x402.
