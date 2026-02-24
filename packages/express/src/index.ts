import { sentinel } from "@x402sentinel/x402";
import type { Request, Response, NextFunction } from "express";

export interface SentinelMiddlewareOptions {
  agentId?: string;
  apiKey?: string;
  baseUrl?: string;
}

/**
 * Express middleware that attaches a Sentinel-wrapped fetch to `req.sentinelFetch`.
 *
 * @example
 * ```ts
 * app.use(sentinelMiddleware());
 * app.get("/data", async (req, res) => {
 *   const data = await req.sentinelFetch("https://api.example.com/paid");
 *   res.json(await data.json());
 * });
 * ```
 */
export function sentinelMiddleware(options?: SentinelMiddlewareOptions) {
  const wrappedFetch = sentinel(globalThis.fetch, options);

  return (req: Request, _res: Response, next: NextFunction) => {
    (req as any).sentinelFetch = wrappedFetch;
    next();
  };
}

export { sentinel } from "@x402sentinel/x402";
