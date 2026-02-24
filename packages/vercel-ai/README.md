# @x402sentinel/vercel-ai

Sentinel for Vercel AI SDK. Add audited x402 payments as a tool in your AI agents.

## Install

```bash
npm install @x402sentinel/vercel-ai @x402sentinel/x402
```

## Usage

```typescript
import { sentinelX402Tool } from "@x402sentinel/vercel-ai";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

const result = await generateText({
  model: openai("gpt-4"),
  tools: {
    x402: sentinelX402Tool({ agentId: "my-agent" }),
  },
  prompt: "Fetch the latest weather data",
});
```

### With API key

```typescript
const result = await generateText({
  model: openai("gpt-4"),
  tools: {
    x402: sentinelX402Tool({
      agentId: "my-agent",
      apiKey: "your-api-key",
    }),
  },
  prompt: "Fetch the latest weather data",
});
```

## Links

- [Sentinel Dashboard](https://sentinel.valeocash.com)
- [Core SDK](https://www.npmjs.com/package/@x402sentinel/x402)
- [GitHub](https://github.com/valeo-cash/Sentinel)

## License

MIT
