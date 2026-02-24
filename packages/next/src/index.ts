import { sentinel } from "@x402sentinel/x402";

export interface SentinelNextOptions {
  agentId?: string;
  apiKey?: string;
  baseUrl?: string;
}

/**
 * Create a pre-configured Sentinel fetch for use in Next.js API routes or server actions.
 *
 * @example
 * ```ts
 * const sentinelFetch = createSentinelFetch({ agentId: "my-agent" });
 * const res = await sentinelFetch("https://api.example.com/paid");
 * ```
 */
export function createSentinelFetch(options?: SentinelNextOptions) {
  return sentinel(globalThis.fetch, options);
}

/**
 * Higher-order function that wraps a Next.js App Router handler with Sentinel fetch.
 *
 * @example
 * ```ts
 * export const GET = withSentinel(async (req, sentinelFetch) => {
 *   const res = await sentinelFetch("https://api.example.com/paid");
 *   return Response.json(await res.json());
 * });
 * ```
 */
export function withSentinel(
  handler: (req: Request, sentinelFetch: typeof fetch) => Promise<Response>,
  options?: SentinelNextOptions,
) {
  const wrappedFetch = sentinel(globalThis.fetch, options);
  return (req: Request) => handler(req, wrappedFetch);
}

export { sentinel } from "@x402sentinel/x402";
