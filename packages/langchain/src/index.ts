import { sentinel } from "@x402sentinel/x402";
import { Tool } from "langchain/tools";

export interface SentinelToolOptions {
  agentId?: string;
  apiKey?: string;
  baseUrl?: string;
}

/**
 * LangChain Tool that makes audited x402 payments via Sentinel.
 *
 * @example
 * ```ts
 * const tools = [new SentinelX402Tool({ agentId: "research-agent" })];
 * ```
 */
export class SentinelX402Tool extends Tool {
  name = "sentinel_x402_fetch";
  description =
    "Make an x402 payment to a paid API endpoint. All payments are audited by Sentinel.";

  private sentinelFetch: typeof fetch;

  constructor(options?: SentinelToolOptions) {
    super();
    this.sentinelFetch = sentinel(globalThis.fetch, options);
  }

  async _call(url: string): Promise<string> {
    const response = await this.sentinelFetch(url);
    return await response.text();
  }
}

export { sentinel } from "@x402sentinel/x402";
