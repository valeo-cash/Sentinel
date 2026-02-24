# x402 Fleet Manager

Run 5 AI agents with individual budget controls and
full audit trails.

## What's inside

| Agent | Role | Daily Budget |
|-------|------|-------------|
| researcher-01 | Research data | $25/day |
| news-fetcher | Fetch news | $10/day |
| price-tracker | Track prices | $5/day |
| content-writer | Generate content | $50/day |
| image-gen | Generate images | $20/day |

Each agent has per-call, hourly, and daily limits.
If any agent tries to overspend — the payment is
blocked before it goes through.

## Quick Start

```bash
git clone https://github.com/valeo-cash/x402-fleet-manager
cd x402-fleet-manager
npm install

# Optional: add your Sentinel API key
export SENTINEL_API_KEY=your-key

npm start
```

## Set up alerts

Go to [sentinel.valeocash.com/dashboard/integrations](https://sentinel.valeocash.com/dashboard/integrations)
to connect Slack, Discord, or PagerDuty. Get notified
when any agent hits 80% of its budget.

## Customize

Edit the `agents` array in `index.ts` to add your own
agents, endpoints, and budget limits.

---
Powered by [Sentinel](https://sentinel.valeocash.com)
