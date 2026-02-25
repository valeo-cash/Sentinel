import type {
  RouteEndpoint,
  ProbeResult,
  EndpointResult,
  PaymentInfo,
  PaymentRouterOptions,
} from "./types.js";
import { BudgetLedger } from "./budget.js";

function inferPaymentFromHeaders(response: Response): PaymentInfo | null {
  const pr = response.headers.get("payment-response");
  if (!pr) return null;
  try {
    const parsed = JSON.parse(Buffer.from(pr, "base64").toString("utf-8"));
    return {
      txHash: parsed.txHash ?? parsed.transactionHash,
      amountRaw: parsed.amount ? String(parsed.amount) : undefined,
      amountUsd: parsed.amountUsd ? Number(parsed.amountUsd) : undefined,
      payTo: parsed.payTo,
      network: parsed.network,
      currency: parsed.currency,
      receiptId: parsed.receiptId,
    };
  } catch {
    return null;
  }
}

async function executeEndpoint(
  endpoint: RouteEndpoint,
  probe: ProbeResult,
  ledger: BudgetLedger,
  options: PaymentRouterOptions,
): Promise<EndpointResult> {
  const start = Date.now();
  const fetchFn = options.paymentFetch ?? globalThis.fetch;

  if (probe.status === "error") {
    return {
      label: endpoint.label,
      url: endpoint.url,
      status: "skipped",
      error: probe.error,
      responseTimeMs: 0,
    };
  }

  if (probe.status === "free") {
    try {
      const timeout = endpoint.timeout ?? options.timeout ?? 10_000;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);

      const response = await globalThis.fetch(endpoint.url, {
        method: endpoint.method ?? "GET",
        headers: endpoint.headers,
        body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
        signal: controller.signal,
      });
      clearTimeout(timer);

      let data: unknown;
      const ct = response.headers.get("content-type") ?? "";
      if (ct.includes("json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      return {
        label: endpoint.label,
        url: endpoint.url,
        status: response.ok ? "success" : "error",
        httpStatus: response.status,
        data,
        responseTimeMs: Date.now() - start,
      };
    } catch (err) {
      return {
        label: endpoint.label,
        url: endpoint.url,
        status: "error",
        error: err instanceof Error ? err.message : String(err),
        responseTimeMs: Date.now() - start,
      };
    }
  }

  const priceUsd = probe.payment?.amountUsd ?? 0;

  if (endpoint.maxUsd !== undefined && priceUsd > endpoint.maxUsd) {
    return {
      label: endpoint.label,
      url: endpoint.url,
      status: "budget-exceeded",
      error: `Endpoint price $${priceUsd} exceeds per-endpoint cap $${endpoint.maxUsd}`,
      responseTimeMs: 0,
    };
  }

  const reserved = await ledger.reserve(priceUsd);
  if (!reserved) {
    return {
      label: endpoint.label,
      url: endpoint.url,
      status: "budget-exceeded",
      error: `Insufficient route budget (remaining: $${ledger.remaining.toFixed(4)}, needed: $${priceUsd})`,
      responseTimeMs: 0,
    };
  }

  try {
    const timeout = endpoint.timeout ?? options.timeout ?? 10_000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    const response = await fetchFn(endpoint.url, {
      method: endpoint.method ?? "GET",
      headers: endpoint.headers,
      body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timer);

    let paymentInfo = options.getPaymentInfo?.() ?? null;
    if (!paymentInfo) {
      paymentInfo = inferPaymentFromHeaders(response);
    }

    let data: unknown;
    const ct = response.headers.get("content-type") ?? "";
    if (ct.includes("json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      ledger.releaseReservation(priceUsd);
      return {
        label: endpoint.label,
        url: endpoint.url,
        status: "payment-failed",
        httpStatus: response.status,
        data,
        error: `Payment request failed with status ${response.status}`,
        responseTimeMs: Date.now() - start,
      };
    }

    const actualUsd = paymentInfo?.amountUsd ?? priceUsd;
    ledger.confirmSpend(actualUsd);
    if (actualUsd !== priceUsd) {
      ledger.releaseReservation(Math.max(0, priceUsd - actualUsd));
    }

    return {
      label: endpoint.label,
      url: endpoint.url,
      status: "success",
      httpStatus: response.status,
      data,
      payment: paymentInfo ?? {
        amountRaw: probe.payment?.amountRaw,
        amountUsd: priceUsd,
        currency: probe.payment?.currency,
        network: probe.payment?.network,
        payTo: probe.payment?.payTo,
      },
      receiptId: paymentInfo?.receiptId,
      responseTimeMs: Date.now() - start,
    };
  } catch (err) {
    ledger.releaseReservation(priceUsd);
    return {
      label: endpoint.label,
      url: endpoint.url,
      status: "error",
      error: err instanceof Error ? err.message : String(err),
      responseTimeMs: Date.now() - start,
    };
  }
}

export async function executeParallel(
  endpoints: RouteEndpoint[],
  probes: ProbeResult[],
  ledger: BudgetLedger,
  options: PaymentRouterOptions,
): Promise<EndpointResult[]> {
  const probeMap = new Map(probes.map((p) => [p.label, p]));

  const promises = endpoints.map(async (ep) => {
    const probe = probeMap.get(ep.label);
    if (!probe) {
      return {
        label: ep.label,
        url: ep.url,
        status: "skipped" as const,
        error: "No probe result",
        responseTimeMs: 0,
      };
    }

    const result = await executeEndpoint(ep, probe, ledger, options);
    await options.onPayment?.(result);
    return result;
  });

  return Promise.all(promises);
}

export async function executeSequential(
  endpoints: RouteEndpoint[],
  probes: ProbeResult[],
  ledger: BudgetLedger,
  options: PaymentRouterOptions,
): Promise<EndpointResult[]> {
  const probeMap = new Map(probes.map((p) => [p.label, p]));

  const sorted = [...endpoints].sort((a, b) => (b.weight ?? 1) - (a.weight ?? 1));

  const results: EndpointResult[] = [];
  let stopped = false;

  for (const ep of sorted) {
    if (stopped) {
      results.push({
        label: ep.label,
        url: ep.url,
        status: "skipped",
        error: "Skipped due to prior required endpoint failure",
        responseTimeMs: 0,
      });
      continue;
    }

    const probe = probeMap.get(ep.label);
    if (!probe) {
      results.push({
        label: ep.label,
        url: ep.url,
        status: "skipped",
        error: "No probe result",
        responseTimeMs: 0,
      });
      continue;
    }

    const result = await executeEndpoint(ep, probe, ledger, options);
    await options.onPayment?.(result);
    results.push(result);

    if (result.status !== "success" && (ep.required !== false)) {
      stopped = true;
    }
  }

  return results;
}

export async function executeBestEffort(
  endpoints: RouteEndpoint[],
  probes: ProbeResult[],
  ledger: BudgetLedger,
  options: PaymentRouterOptions,
): Promise<EndpointResult[]> {
  return executeParallel(endpoints, probes, ledger, options);
}
