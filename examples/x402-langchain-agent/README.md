# x402 LangChain Agent

A LangChain research agent that pays for data from
x402 endpoints. Every payment audited by Sentinel.

## What it does

1. Agent receives a research task
2. Uses x402 endpoints to fetch paid data
3. All payments tracked with full audit trails
4. Budget limits prevent overspending
5. Cryptographic receipt for every payment

## Quick Start

```bash
git clone https://github.com/valeo-cash/x402-langchain-agent
cd x402-langchain-agent
cp .env.example .env  # Add your API keys
npm install
npm start
```

## Environment Variables

```
OPENAI_API_KEY=your-openai-key
SENTINEL_API_KEY=your-sentinel-key  # optional
```

## View your agent's spending

Open [sentinel.valeocash.com](https://sentinel.valeocash.com)
to see every payment your LangChain agent made — amount,
endpoint, tx hash, receipt.

### Test Your Endpoints

```bash
npx @x402sentinel/test https://your-endpoint.com
```

Verify your x402 endpoints are correctly configured before going to production.

---
Powered by [Sentinel](https://sentinel.valeocash.com)
