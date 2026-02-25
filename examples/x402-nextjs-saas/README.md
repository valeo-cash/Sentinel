# x402 Next.js SaaS Template

A SaaS starter that charges users via x402 payments.
Every payment tracked by Sentinel.

## Endpoints

| Route | Price | Description |
|-------|-------|-------------|
| /api/weather | $0.01 | Weather data |
| /api/summarize | $0.05 | Text summarization |
| /api/translate | $0.03 | Translation |

## Quick Start

```bash
git clone https://github.com/valeo-cash/x402-nextjs-saas
cd x402-nextjs-saas
npm install
npm run dev
```

Open http://localhost:3000

All x402 payments are automatically tracked by Sentinel
with audit trails, budget controls, and cryptographic
receipts.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/valeo-cash/x402-nextjs-saas)

### Test Your Endpoints

```bash
npx @x402sentinel/test https://your-endpoint.com
```

Verify your x402 endpoints are correctly configured before going to production.

---
Powered by [Sentinel](https://sentinel.valeocash.com)
