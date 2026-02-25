import { wrapWithSentinel } from "./wrapper/index";
import { ApiStorage } from "./audit/storage/api";

export interface SentinelOptions {
  agentId?: string;
  apiKey?: string;
  baseUrl?: string;
}

/**
 * Zero-config Sentinel wrapper. One line to audit every x402 payment.
 *
 * @example
 * ```ts
 * import { sentinel } from "@x402sentinel/x402";
 * const fetch = sentinel(globalThis.fetch);
 * ```
 */
export function sentinel(
  fetchFn: typeof fetch,
  options?: SentinelOptions,
): typeof fetch {
  const agentId = options?.agentId || `agent-${Date.now().toString(36)}`;
  const apiKey = options?.apiKey || "anonymous";
  const baseUrl = options?.baseUrl || "https://sentinel.valeocash.com";

  const wrapped = wrapWithSentinel(fetchFn, {
    agentId,
    budget: {
      maxPerCall: "10.00",
      maxPerHour: "100.00",
      maxPerDay: "1000.00",
    },
    audit: {
      storage: new ApiStorage({
        baseUrl: `${baseUrl}/api/v1`,
        apiKey,
      }),
    },
  });

  if (apiKey === "anonymous") {
    let hasLoggedOnce = false;
    const sentinelFetch: typeof fetch = async (
      input: RequestInfo | URL,
      init?: RequestInit,
    ): Promise<Response> => {
      const response = await wrapped(input, init);

      if (
        !hasLoggedOnce &&
        (response.headers.has("payment-response") ||
          response.headers.has("x-payment-response"))
      ) {
        hasLoggedOnce = true;
        console.log(`
\u2713 Payment tracked by Sentinel
  Agent: ${agentId}
  View: ${baseUrl}/agent/${agentId}

  Create account to unlock full dashboard:
  ${baseUrl}/login
`);
      }

      return response;
    };
    return sentinelFetch;
  }

  return wrapped;
}
