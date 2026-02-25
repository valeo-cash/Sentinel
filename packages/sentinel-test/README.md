# sentinel-test

Test any x402 payment endpoint from your terminal. Like Postman for x402.

## Quick Start

```bash
npx sentinel-test https://api.example.com/endpoint
```

## What It Tests

1. **Reachability** — endpoint responds with HTTP 402
2. **Payment Schema** — valid amount, currency, network, receiver address
3. **Facilitator** — facilitator URL is reachable (if provided)
4. **Response Quality** — response time, CORS headers, HTTPS
5. **Sentinel Integration** — checks for Sentinel audit trail headers

## Options

| Flag | Description |
|------|-------------|
| `--network <name>` | Expected network (base, solana, etc) |
| `--verbose` | Show full response details |
| `--json` | Output results as JSON |
| `--timeout <ms>` | Request timeout (default: 10000) |

## Score

Each endpoint gets a score from 0-10:
- Failed critical checks: -3 each
- Failed warning checks: -1 each
- Exit code 0 if score >= 5, exit code 1 otherwise

## Links

- [Sentinel Dashboard](https://sentinel.valeocash.com)
- [Sentinel CLI](https://npmjs.com/package/create-sentinel)
- [x402 SDK](https://npmjs.com/package/@x402sentinel/x402)
