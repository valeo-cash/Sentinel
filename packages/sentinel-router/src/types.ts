export interface PaymentInfo {
  txHash?: string;
  amountRaw?: string;
  amountUsd?: number;
  payTo?: string;
  network?: string;
  currency?: string;
  receiptId?: string;
}

export interface RouteEndpoint {
  label: string;
  url: string;
  maxUsd?: number;
  weight?: number;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: unknown;
  required?: boolean;
  timeout?: number;
}

export type RouteStrategy = "parallel" | "sequential" | "best-effort";

export type PaymentMode = "multiTx" | "singleTx";

export interface RouteConfig {
  name: string;
  description?: string;
  endpoints: RouteEndpoint[];
  maxBudgetUsd: string;
  strategy?: RouteStrategy;
  mode?: PaymentMode;
  timeout?: number;
  metadata?: Record<string, unknown>;
}

export interface DiscoveredPayment {
  url: string;
  amountRaw: string;
  amountUsd: number;
  currency: string;
  tokenAddress?: string;
  network: string;
  payTo: string;
  scheme?: string;
  facilitator?: string;
  parseConfidence: "high" | "medium" | "low";
  raw: {
    headers: Record<string, string>;
    body: string;
  };
}

export interface ProbeResult {
  label: string;
  url: string;
  status: "requires-payment" | "free" | "error";
  payment?: DiscoveredPayment;
  error?: string;
  responseTimeMs: number;
}

export interface EndpointResult {
  label: string;
  url: string;
  status: "success" | "payment-failed" | "budget-exceeded" | "error" | "skipped";
  httpStatus?: number;
  data?: unknown;
  payment?: PaymentInfo;
  receiptId?: string;
  error?: string;
  responseTimeMs: number;
}

export interface UnifiedReceipt {
  id: string;
  routeName: string;
  timestamp: string;
  totalSpent: {
    amount: string;
    amountUsd: number;
    currency: string;
  };
  maxBudgetUsd: number;
  payments: Array<{
    label: string;
    url: string;
    amountRaw: string;
    amountUsd: number;
    currency: string;
    network: string;
    txHash?: string;
    payTo: string;
    receiptId?: string;
  }>;
  execution: {
    strategy: RouteStrategy;
    mode: PaymentMode;
    totalEndpoints: number;
    successfulEndpoints: number;
    failedEndpoints: number;
    totalTimeMs: number;
  };
  agentId: string;
  receiptHash: string;
  sentinelSig?: string;
  subReceiptHashes: string[];
}

export interface RouteExecutionResult {
  success: boolean;
  results: Record<string, EndpointResult>;
  resultsList: EndpointResult[];
  receipt: UnifiedReceipt;
  maxBudgetUsd: number;
  totalSpentUsd: number;
  totalTimeMs: number;
  discovery: ProbeResult[];
  routeSnapshot: RouteConfig;
  mode: PaymentMode;
}

export interface DiscoverResult {
  probes: ProbeResult[];
  estimatedTotalUsd: number;
  perEndpoint: Array<{
    label: string;
    discoveredPriceUsd: number;
    maxUsd: number | null;
    withinCap: boolean;
  }>;
  withinTotalBudget: boolean;
  singleTxCompatible: boolean;
}

export interface PaymentRouterOptions {
  agentId?: string;
  apiKey?: string;
  sentinelUrl?: string;
  paymentFetch?: typeof fetch;
  getPaymentInfo?: () => PaymentInfo | null;
  timeout?: number;
  parse402?: (response: Response, body: string) => DiscoveredPayment | null;
  resolveToken?: (address: string, network: string) => { symbol: string; decimals: number } | null;
  onPayment?: (result: EndpointResult) => void | Promise<void>;
  onComplete?: (result: RouteExecutionResult) => void | Promise<void>;
  onError?: (label: string, error: Error) => void | Promise<void>;
}
