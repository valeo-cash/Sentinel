export * from "./x402-stubs";
export * from "./audit";
export * from "./budget";
export * from "./config";

/** Context about a payment that is about to happen or just happened */
export interface PaymentContext {
  /** Full URL being requested */
  endpoint: string;
  /** HTTP method */
  method: string;
  /** Agent making the request */
  agentId: string;
  /** Team the agent belongs to */
  team: string | null;
  /** Payment amount in human-readable USDC */
  amount: string;
  /** Raw base-unit amount string */
  amountRaw: string;
  /** Token address or symbol */
  asset: string;
  /** Network identifier (CAIP-2) */
  network: string;
  /** x402 scheme (e.g., "exact") */
  scheme: string;
  /** Recipient address */
  payTo: string;
  /** When this context was created (unix ms) */
  timestamp: number;
  /** Custom metadata from config */
  metadata: Record<string, string>;
}

/** Decision returned by a beforePayment hook */
export interface PaymentDecision {
  /** Whether to proceed with the payment */
  proceed: boolean;
  /** Reason if blocked */
  reason?: string;
}

/** Anomaly detected by spike detection or other heuristics */
export interface Anomaly {
  type: "spike" | "unusual_endpoint" | "high_frequency" | "custom";
  /** Human-readable description */
  message: string;
  /** The payment context that triggered the anomaly */
  context: PaymentContext;
  /** Severity level */
  severity: "low" | "medium" | "high" | "critical";
  /** Additional details */
  details: Record<string, string>;
}

/** Configuration for automatic record enrichment */
export interface EnrichmentConfig {
  /** Tag rules: if endpoint matches pattern, add these tags */
  tagRules?: Array<{
    pattern: string;
    tags: string[];
  }>;
  /** Static tags added to every record */
  staticTags?: string[];
  /** Whether to include request headers in metadata (default false) */
  captureRequestHeaders?: boolean;
}
