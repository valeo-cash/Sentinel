import { createHash, randomBytes } from "node:crypto";
import type {
  RouteConfig,
  RouteStrategy,
  PaymentMode,
  EndpointResult,
  UnifiedReceipt,
} from "./types.js";

async function sha256(data: string): Promise<string> {
  if (typeof globalThis.process !== "undefined") {
    return createHash("sha256").update(data).digest("hex");
  }
  const encoded = new TextEncoder().encode(data);
  const buf = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function canonicalJson(obj: unknown): string {
  return JSON.stringify(obj, Object.keys(obj as Record<string, unknown>).sort());
}

function generateId(): string {
  const ts = Date.now().toString(36);
  const rand = randomBytes(6).toString("hex").slice(0, 6);
  return `ur_${ts}_${rand}`;
}

export function isRouteSuccessful(
  strategy: RouteStrategy,
  results: EndpointResult[],
  requiredFlags: boolean[],
): boolean {
  if (strategy === "best-effort") {
    return results.some((r) => r.status === "success");
  }
  return results.every((r, i) => {
    if (!requiredFlags[i]) return true;
    return r.status === "success";
  });
}

export async function generateUnifiedReceipt(
  config: RouteConfig,
  results: EndpointResult[],
  agentId: string,
  totalTimeMs: number,
  mode: PaymentMode,
): Promise<UnifiedReceipt> {
  const strategy = config.strategy ?? "parallel";
  const successResults = results.filter((r) => r.status === "success" && r.payment);

  const totalUsd = successResults.reduce(
    (sum, r) => sum + (r.payment?.amountUsd ?? 0),
    0,
  );

  const currencies = new Set(
    successResults
      .map((r) => r.payment?.currency)
      .filter(Boolean) as string[],
  );
  const primaryCurrency = currencies.size === 1
    ? [...currencies][0]!
    : currencies.size > 0 ? [...currencies].join("/") : "USDC";

  const subReceiptHashes: string[] = [];
  for (const r of successResults) {
    const subPayment = {
      label: r.label,
      url: r.url,
      txHash: r.payment?.txHash,
      amountRaw: r.payment?.amountRaw,
      amountUsd: r.payment?.amountUsd,
      payTo: r.payment?.payTo,
      network: r.payment?.network,
      currency: r.payment?.currency,
    };
    const hash = await sha256(canonicalJson(subPayment));
    subReceiptHashes.push(hash);
  }

  const payments = successResults.map((r) => ({
    label: r.label,
    url: r.url,
    amountRaw: r.payment?.amountRaw ?? "0",
    amountUsd: r.payment?.amountUsd ?? 0,
    currency: r.payment?.currency ?? "USDC",
    network: r.payment?.network ?? "",
    txHash: r.payment?.txHash,
    payTo: r.payment?.payTo ?? "",
    receiptId: r.receiptId,
  }));

  const receipt: Omit<UnifiedReceipt, "receiptHash" | "sentinelSig"> = {
    id: generateId(),
    routeName: config.name,
    timestamp: new Date().toISOString(),
    totalSpent: {
      amount: totalUsd.toFixed(6),
      amountUsd: totalUsd,
      currency: primaryCurrency,
    },
    maxBudgetUsd: parseFloat(config.maxBudgetUsd.replace(/[^0-9.]/g, "")),
    payments,
    execution: {
      strategy,
      mode,
      totalEndpoints: results.length,
      successfulEndpoints: results.filter((r) => r.status === "success").length,
      failedEndpoints: results.filter(
        (r) => r.status !== "success" && r.status !== "skipped",
      ).length,
      totalTimeMs,
    },
    agentId,
    subReceiptHashes,
  };

  const receiptHash = await sha256(canonicalJson(receipt));

  return {
    ...receipt,
    receiptHash,
    sentinelSig: undefined,
  } as UnifiedReceipt;
}
