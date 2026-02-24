# @x402sentinel/express

Sentinel middleware for Express.js. One line.

## Install

```bash
npm install @x402sentinel/express @x402sentinel/x402
```

## Usage

```typescript
import express from "express";
import { sentinelMiddleware } from "@x402sentinel/express";

const app = express();
app.use(sentinelMiddleware());

app.get("/data", async (req, res) => {
  const data = await req.sentinelFetch("https://api.example.com/paid-endpoint");
  res.json(await data.json());
});
```

Every x402 payment is now tracked automatically.

### With options

```typescript
app.use(sentinelMiddleware({
  agentId: "my-express-agent",
  apiKey: "your-api-key",
}));
```

## How it works

The middleware attaches a Sentinel-wrapped `fetch` to `req.sentinelFetch`. Every call through it that triggers an x402 payment is automatically logged with agent ID, endpoint, amount, and transaction hash.

## Links

- [Sentinel Dashboard](https://sentinel.valeocash.com)
- [Core SDK](https://www.npmjs.com/package/@x402sentinel/x402)
- [GitHub](https://github.com/valeo-cash/Sentinel)

## License

MIT
