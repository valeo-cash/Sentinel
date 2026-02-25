import type {
  RouteConfig,
  RouteEndpoint,
  PaymentMode,
  PaymentRouterOptions,
  RouteExecutionResult,
  DiscoverResult,
  EndpointResult,
  ProbeResult,
} from "./types.js";
import { probeAllEndpoints } from "./discovery.js";
import { BudgetLedger } from "./budget.js";
import { executeParallel, executeSequential, executeBestEffort } from "./strategies.js";
import { generateUnifiedReceipt, isRouteSuccessful } from "./receipt.js";

function parseBudget(raw: string): number {
  const cleaned = raw.replace(/[^0-9.]/g, "");
  const val = parseFloat(cleaned);
  if (isNaN(val) || val <= 0) throw new Error(`Invalid maxBudgetUsd: "${raw}"`);
  return val;
}

function normalizeWeights(endpoints: RouteEndpoint[]): RouteEndpoint[] {
  const hasWeights = endpoints.some((e) => e.weight !== undefined);
  if (!hasWeights) {
    const equal = 1 / endpoints.length;
    return endpoints.map((e) => ({ ...e, weight: equal }));
  }

  const total = endpoints.reduce((s, e) => s + (e.weight ?? 1), 0);
  return endpoints.map((e) => ({
    ...e,
    weight: (e.weight ?? 1) / total,
  }));
}

function validateConfig(config: RouteConfig): void {
  if (!config.name || typeof config.name !== "string") {
    throw new Error("Route name is required");
  }
  if (!config.endpoints || !Array.isArray(config.endpoints)) {
    throw new Error("Endpoints array is required");
  }
  if (config.endpoints.length === 0 || config.endpoints.length > 20) {
    throw new Error("Route must have between 1 and 20 endpoints");
  }
  parseBudget(config.maxBudgetUsd);

  const labels = new Set<string>();
  for (const ep of config.endpoints) {
    if (!ep.label) throw new Error("Each endpoint must have a label");
    if (!ep.url) throw new Error(`Endpoint "${ep.label}" must have a url`);
    if (labels.has(ep.label)) throw new Error(`Duplicate endpoint label: "${ep.label}"`);
    labels.add(ep.label);
    if (ep.weight !== undefined && ep.weight <= 0) {
      throw new Error(`Endpoint "${ep.label}" weight must be > 0`);
    }
  }
}

function validateSingleTx(probes: ProbeResult[]): void {
  const paidProbes = probes.filter((p) => p.status === "requires-payment" && p.payment);
  if (paidProbes.length < 2) return;

  const networks = new Set(paidProbes.map((p) => p.payment!.network));
  const currencies = new Set(paidProbes.map((p) => p.payment!.tokenAddress ?? p.payment!.currency));

  if (networks.size > 1 || currencies.size > 1) {
    const found = paidProbes.map((p) =>
      `${p.label}: ${p.payment!.network}/${p.payment!.currency}`
    ).join(", ");
    throw new Error(
      `singleTx requires all endpoints to use the same network and token. Found: [${found}]. Use mode: 'multiTx' instead.`
    );
  }
}

export class PaymentRouter {
  private options: PaymentRouterOptions;
  private routes = new Map<string, RouteConfig>();

  constructor(options?: PaymentRouterOptions) {
    this.options = options ?? {};
  }

  register(config: RouteConfig): this {
    validateConfig(config);
    this.routes.set(config.name, config);
    return this;
  }

  getRoute(name: string): RouteConfig | undefined {
    return this.routes.get(name);
  }

  listRoutes(): RouteConfig[] {
    return [...this.routes.values()];
  }

  unregister(name: string): boolean {
    return this.routes.delete(name);
  }

  async discover(config: RouteConfig): Promise<DiscoverResult> {
    validateConfig(config);
    const budget = parseBudget(config.maxBudgetUsd);
    const probes = await probeAllEndpoints(config.endpoints, this.options);

    let estimatedTotalUsd = 0;
    const perEndpoint = config.endpoints.map((ep) => {
      const probe = probes.find((p) => p.label === ep.label);
      const price = probe?.payment?.amountUsd ?? 0;
      estimatedTotalUsd += price;
      return {
        label: ep.label,
        discoveredPriceUsd: price,
        maxUsd: ep.maxUsd ?? null,
        withinCap: ep.maxUsd === undefined || price <= ep.maxUsd,
      };
    });

    const paidProbes = probes.filter((p) => p.status === "requires-payment" && p.payment);
    const networks = new Set(paidProbes.map((p) => p.payment!.network));
    const currencies = new Set(paidProbes.map((p) => p.payment!.tokenAddress ?? p.payment!.currency));
    const singleTxCompatible = networks.size <= 1 && currencies.size <= 1;

    return {
      probes,
      estimatedTotalUsd,
      perEndpoint,
      withinTotalBudget: estimatedTotalUsd <= budget,
      singleTxCompatible,
    };
  }

  async execute(nameOrConfig: string | RouteConfig): Promise<RouteExecutionResult> {
    // Phase 1: Resolve + validate
    const config = typeof nameOrConfig === "string"
      ? this.routes.get(nameOrConfig)
      : nameOrConfig;

    if (!config) {
      throw new Error(
        typeof nameOrConfig === "string"
          ? `Route "${nameOrConfig}" not found. Register it first.`
          : "Invalid route config"
      );
    }

    validateConfig(config);
    const maxBudget = parseBudget(config.maxBudgetUsd);
    const strategy = config.strategy ?? "parallel";
    const mode: PaymentMode = config.mode ?? "multiTx";
    const endpoints = normalizeWeights(config.endpoints);
    const routeSnapshot = { ...config, endpoints };

    // Phase 2: Discovery
    const probes = await probeAllEndpoints(endpoints, this.options);

    // Phase 3: Budget pre-check
    const estimatedTotal = probes.reduce(
      (s, p) => s + (p.payment?.amountUsd ?? 0),
      0,
    );
    if (estimatedTotal > maxBudget) {
      console.warn(
        `[sentinel-router] Estimated cost $${estimatedTotal.toFixed(4)} exceeds budget $${maxBudget}. Hard enforcement at payment time.`
      );
    }

    // Phase 4: singleTx validation (requires discovery data)
    if (mode === "singleTx") {
      validateSingleTx(probes);
    }

    // Phase 5: Execute
    const ledger = new BudgetLedger(maxBudget);
    const execStart = Date.now();

    let results: EndpointResult[];
    switch (strategy) {
      case "sequential":
        results = await executeSequential(endpoints, probes, ledger, this.options);
        break;
      case "best-effort":
        results = await executeBestEffort(endpoints, probes, ledger, this.options);
        break;
      case "parallel":
      default:
        results = await executeParallel(endpoints, probes, ledger, this.options);
        break;
    }

    const totalTimeMs = Date.now() - execStart;

    // Phase 6: Receipt + Report
    const requiredFlags = endpoints.map((e) => e.required !== false);
    const success = isRouteSuccessful(strategy, results, requiredFlags);

    const receipt = await generateUnifiedReceipt(
      config,
      results,
      this.options.agentId ?? "anonymous",
      totalTimeMs,
      mode,
    );

    // POST receipt to Sentinel for sentinelSig
    const sentinelUrl = this.options.sentinelUrl ?? "https://sentinel.valeocash.com";
    if (this.options.apiKey) {
      try {
        const res = await globalThis.fetch(
          `${sentinelUrl}/api/v1/routes/executions`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${this.options.apiKey}`,
            },
            body: JSON.stringify({
              routeName: config.name,
              routeId: null,
              agentId: this.options.agentId,
              success,
              strategy,
              mode,
              totalSpent: receipt.totalSpent.amount,
              totalSpentUsd: receipt.totalSpent.amountUsd,
              maxBudgetUsd: maxBudget,
              endpointCount: results.length,
              successCount: results.filter((r) => r.status === "success").length,
              failedCount: results.filter(
                (r) => r.status !== "success" && r.status !== "skipped",
              ).length,
              totalTimeMs,
              receipt,
              receiptHash: receipt.receiptHash,
              routeSnapshot,
              discoverySnapshot: probes,
            }),
          },
        );

        if (res.ok) {
          const body = await res.json() as { sentinelSig?: string };
          if (body.sentinelSig) {
            receipt.sentinelSig = body.sentinelSig;
          }
        }
      } catch {
        // Sentinel reporting is best-effort
      }
    }

    const resultsMap: Record<string, EndpointResult> = {};
    for (const r of results) {
      resultsMap[r.label] = r;
    }

    const executionResult: RouteExecutionResult = {
      success,
      results: resultsMap,
      resultsList: results,
      receipt,
      maxBudgetUsd: maxBudget,
      totalSpentUsd: ledger.totalSpent,
      totalTimeMs,
      discovery: probes,
      routeSnapshot,
      mode,
    };

    await this.options.onComplete?.(executionResult);

    return executionResult;
  }
}
