import { sentinel } from "@x402sentinel/x402";
import { tool } from "ai";
import { z } from "zod";

export interface SentinelAIToolOptions {
  agentId?: string;
  apiKey?: string;
  baseUrl?: string;
}

/**
 * Vercel AI SDK tool for making audited x402 payments via Sentinel.
 *
 * @example
 * ```ts
 * const result = await generateText({
 *   model: openai("gpt-4"),
 *   tools: { x402: sentinelX402Tool({ agentId: "my-agent" }) },
 *   prompt: "Fetch the latest weather data",
 * });
 * ```
 */
export function sentinelX402Tool(options?: SentinelAIToolOptions) {
  const sentinelFetch = sentinel(globalThis.fetch, options);

  return tool({
    description:
      "Fetch data from an x402 paid endpoint. Payment is automatic and audited by Sentinel.",
    parameters: z.object({
      url: z.string().describe("The x402 endpoint URL to call"),
    }),
    execute: async ({ url }) => {
      const response = await sentinelFetch(url);
      return await response.text();
    },
  });
}

export { sentinel } from "@x402sentinel/x402";
