# x402 Enterprise Compliance

Production-ready x402 agent setup with full compliance
infrastructure. Built for regulated companies.

## What's included

- Agent with strict budget policies
- Full audit trail on every payment
- Cryptographic receipts
- Compliance setup checklist
- SOC 2 evidence guide

## Quick Start

```bash
git clone https://github.com/valeo-cash/x402-enterprise-compliance
cd x402-enterprise-compliance
cp .env.example .env  # Add your API key
npm install
npm start
```

Then follow the [Setup Guide](./setup-guide.md) to
configure alerts, reports, and team access.

### Test Your Endpoints

```bash
npx @x402sentinel/test https://your-endpoint.com
```

Verify your x402 endpoints are correctly configured before going to production.

---
Powered by [Sentinel](https://sentinel.valeocash.com)
