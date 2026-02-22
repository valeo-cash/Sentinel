import type { SentinelConfig } from "../types/config";
import { BudgetManager } from "../budget/index";
import { AuditLogger } from "../audit/index";
import { MemoryStorage } from "../audit/storage/memory";
import { SentinelBudgetError, validateConfig } from "../errors";
import { beforeRequest, afterResponse } from "./interceptor";
import type { InterceptorDeps } from "./interceptor";

/**
 * Wrap an x402-enabled fetch function with Sentinel budget enforcement and audit logging.
 *
 * @param fetchWithPayment - The x402-wrapped fetch (from wrapFetchWithPayment)
 * @param config - Sentinel configuration (agent identity, budget, audit settings)
 * @returns A drop-in replacement fetch function with Sentinel instrumentation
 *
 * @example
 * ```ts
 * const fetchWithSentinel = wrapWithSentinel(fetchWithPayment, {
 *   agentId: "agent-weather-001",
 *   budget: standardPolicy(),
 * });
 * const response = await fetchWithSentinel("https://api.example.com/weather");
 * ```
 */
export function wrapWithSentinel(
  fetchWithPayment: typeof fetch,
  config: SentinelConfig,
): typeof fetch {
  validateConfig(config);

  const budgetManager = config.budget ? new BudgetManager(config.budget) : null;
  const auditLogger = new AuditLogger(config.audit ?? { enabled: true, storage: new MemoryStorage() });

  const deps: InterceptorDeps = { budgetManager, auditLogger, config };

  const sentinelFetch: typeof fetch = async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const startTime = Date.now();

    // BEFORE: Check endpoint-level budget rules
    const pre = beforeRequest(url, init, deps);
    if (!pre.proceed && pre.evaluation && !pre.evaluation.allowed) {
      const violation = pre.evaluation.violation;

      // Log the blocked attempt (non-fatal if logging fails)
      try {
        await auditLogger.logBlocked(pre.context, violation, {
          humanSponsor: config.humanSponsor,
          metadata: config.metadata,
        });
      } catch {
        // audit failures never block
      }

      if (config.hooks?.onBudgetExceeded) {
        try {
          await config.hooks.onBudgetExceeded(violation);
        } catch {
          // hooks must never block
        }
      }

      throw new SentinelBudgetError(violation);
    }

    // EXECUTE: Call the underlying x402-wrapped fetch
    let response: Response;
    try {
      response = await fetchWithPayment(input, init);
    } catch (err) {
      // Network error — log and re-throw
      try {
        const record = {
          agent_id: pre.context.agentId,
          team: pre.context.team,
          human_sponsor: config.humanSponsor ?? null,
          amount: "0.000000",
          amount_raw: "0",
          asset: "",
          network: "",
          scheme: "",
          tx_hash: null,
          payer_address: "",
          payee_address: "",
          facilitator: null,
          endpoint: url,
          method: pre.context.method,
          status_code: 0,
          response_time_ms: Date.now() - startTime,
          policy_id: null,
          policy_evaluation: "flagged" as const,
          budget_remaining: null,
          task_id: null,
          session_id: null,
          metadata: { error: err instanceof Error ? err.message : String(err) },
          settled_at: null,
          tags: ["error", "network_failure"],
        };
        await auditLogger.log(record);
      } catch {
        // audit failures never block
      }
      throw err;
    }

    // AFTER: Parse response headers (NEVER touch the body), log audit record
    await afterResponse(response, pre.context, startTime, deps);

    // Return the original Response object completely untouched
    return response;
  };

  return sentinelFetch;
}
