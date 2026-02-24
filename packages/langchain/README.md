# @x402sentinel/langchain

Sentinel tool for LangChain agents. Every x402 payment your chain makes is audited.

## Install

```bash
npm install @x402sentinel/langchain @x402sentinel/x402
```

## Usage

```typescript
import { SentinelX402Tool } from "@x402sentinel/langchain";

const tools = [
  new SentinelX402Tool({ agentId: "research-agent" }),
];

// Use in your LangChain agent — all x402 payments tracked
```

### With API key

```typescript
const tools = [
  new SentinelX402Tool({
    agentId: "research-agent",
    apiKey: "your-api-key",
  }),
];
```

## How it works

`SentinelX402Tool` extends LangChain's `Tool` class. When an agent calls it with a URL, it makes the request through Sentinel-wrapped fetch. Every x402 payment is automatically logged with full audit data.

## Links

- [Sentinel Dashboard](https://sentinel.valeocash.com)
- [Core SDK](https://www.npmjs.com/package/@x402sentinel/x402)
- [GitHub](https://github.com/valeo-cash/Sentinel)

## License

MIT
