import type {
  SummaryResult as _SummaryResult,
  ByAgentRow as _ByAgentRow,
  ByNetworkRow as _ByNetworkRow,
  ByEndpointRow as _ByEndpointRow,
  TimeseriesRow as _TimeseriesRow,
} from "@/server/analytics";

export type SummaryResult = _SummaryResult;
export type ByAgentRow = _ByAgentRow;
export type ByNetworkRow = _ByNetworkRow;
export type ByEndpointRow = _ByEndpointRow;
export type TimeseriesRow = _TimeseriesRow;

export interface PaymentRow {
  id: string;
  agentId: string;
  agentExternalId: string;
  endpoint: string;
  amount: string | null;
  amountUsd: number | null;
  asset: string | null;
  network: string | null;
  txHash: string | null;
  status: string;
  timestamp: string;
}

export interface PolicyRow {
  id: string;
  name: string;
  agentExternalId: string | null;
  policy: unknown;
  isActive: boolean;
}

export interface AlertRow {
  id: string;
  agentId: string | null;
  type: string;
  severity: string;
  message: string;
  resolved: boolean;
  createdAt: Date;
}

export interface ReceiptRow {
  id: string;
  agentId: string;
  paymentId: string | null;
  verified: boolean;
  createdAt: Date;
}

export interface RiskAssessment {
  level: "Low" | "Medium" | "High";
  findings: string[];
  recommendations: string[];
}

export interface ComplianceData {
  teamName: string;
  startDate: string;
  endDate: string;
  generatedAt: string;

  summary: SummaryResult;
  timeseries: TimeseriesRow[];
  byAgent: ByAgentRow[];
  byNetwork: ByNetworkRow[];
  byEndpoint: ByEndpointRow[];

  payments: PaymentRow[];
  policies: PolicyRow[];
  alerts: AlertRow[];
  receipts: ReceiptRow[];

  risk: RiskAssessment;
}
