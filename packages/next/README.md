# @x402sentinel/next

Sentinel for Next.js. One line.

## Install

```bash
npm install @x402sentinel/next @x402sentinel/x402
```

## Usage

### Route handler wrapper

```typescript
// app/api/data/route.ts
import { withSentinel } from "@x402sentinel/next";

export const GET = withSentinel(async (req, sentinelFetch) => {
  const res = await sentinelFetch("https://api.example.com/paid");
  return Response.json(await res.json());
});
```

### Standalone fetch

```typescript
import { createSentinelFetch } from "@x402sentinel/next";

const sentinelFetch = createSentinelFetch({ agentId: "my-agent" });

export async function getServerSideProps() {
  const res = await sentinelFetch("https://api.example.com/paid");
  return { props: { data: await res.json() } };
}
```

## Links

- [Sentinel Dashboard](https://sentinel.valeocash.com)
- [Core SDK](https://www.npmjs.com/package/@x402sentinel/x402)
- [GitHub](https://github.com/valeo-cash/Sentinel)

## License

MIT
