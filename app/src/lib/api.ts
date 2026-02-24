export interface Team {
  id: string;
  name: string;
  plan: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  teamId: string;
  agentId: string;
  url: string;
  method: string;
  endpointDomain: string;
  status: string;
  amount: string | null;
  amountUsd: number | null;
  asset: string | null;
  network: string | null;
  txHash: string | null;
  scheme: string | null;
  payTo: string | null;
  taskId: string | null;
  category: string | null;
  description: string | null;
  tags: string[] | null;
  budgetEvaluation: string | null;
  budgetViolation: string | null;
  budgetUtilization: number | null;
  budgetSpent: string | null;
  budgetLimit: string | null;
  responseTimeMs: number | null;
  timestamp: string;
  createdAt: string;
  agent?: { id: string; externalId: string; name: string | null } | null;
}

export interface Agent {
  id: string;
  teamId: string;
  externalId: string;
  name: string | null;
  authorizedBy: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  metadata: unknown;
  paymentCount?: number;
  totalSpent?: number;
}

export interface Alert {
  id: string;
  teamId: string;
  agentId: string | null;
  paymentId: string | null;
  type: string;
  severity: string;
  message: string;
  metadata: unknown;
  resolved: boolean;
  createdAt: string;
}

export interface Policy {
  id: string;
  teamId: string;
  agentExternalId: string | null;
  name: string;
  policy: unknown;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AlertChannel {
  id: string;
  teamId: string;
  channel: string;
  config: Record<string, unknown>;
  severities: string[];
  digestMode: boolean;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledReport {
  id: string;
  teamId: string;
  reportType: string;
  frequency: string;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  timeUtc: string;
  timezone: string;
  recipients: string[];
  agentFilter: string | null;
  enabled: boolean;
  lastSentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomDashboard {
  id: string;
  teamId: string;
  name: string;
  layout: WidgetLayout[];
  createdAt: string;
  updatedAt: string;
}

export interface Receipt {
  id: string;
  teamId: string;
  paymentId: string | null;
  agentId: string;
  endpoint: string;
  method: string;
  amount: string;
  currency: string;
  network: string;
  txHash: string | null;
  requestHash: string;
  responseHash: string;
  responseStatus: number | null;
  responseSize: number | null;
  sentinelSignature: string;
  verified: boolean;
  expiresAt: string | null;
  createdAt: string;
}

export interface WidgetLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  next_cursor: string | null;
  total: number;
}

export interface AnalyticsSummary {
  total_spent_usd: number;
  total_payments: number;
  total_failed: number;
  total_blocked: number;
  active_agents: number;
  unique_endpoints: number;
  avg_payment_usd: number;
  max_payment_usd: number;
  period_change: {
    total_spent_pct: number;
    total_payments_pct: number;
    total_failed_pct: number;
    total_blocked_pct: number;
  };
}

export interface TimeseriesBucket {
  timestamp: string;
  total_usd: number;
  count: number;
  avg_usd: number;
}

export interface GroupedSpend {
  key: string;
  name?: string;
  total_usd: number;
  count: number;
  avg_usd: number;
}

export interface PaymentQuery {
  agent_id?: string;
  category?: string;
  network?: string;
  status?: string;
  endpoint?: string;
  from?: string;
  to?: string;
  cursor?: string;
  limit?: number;
  sort?: string;
  search?: string;
}

export interface AlertQuery {
  type?: string;
  severity?: string;
  resolved?: string;
  agent_id?: string;
  from?: string;
  to?: string;
  cursor?: string;
  limit?: number;
}

class SentinelAPI {
  private apiKey: string | null;

  constructor(apiKey?: string | null) {
    this.apiKey = apiKey ?? null;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options?.headers as Record<string, string>) ?? {}),
    };
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    const res = await fetch(`/api${path}`, {
      ...options,
      headers,
      credentials: "include",
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: "Request failed" }));
      throw new Error(error.error || `HTTP ${res.status}`);
    }
    return res.json();
  }

  async validate(): Promise<Team> {
    return this.request("/v1/team");
  }

  async getPayments(params: PaymentQuery = {}): Promise<PaginatedResponse<Payment>> {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v != null && v !== "") qs.set(k, String(v));
    });
    return this.request(`/v1/payments?${qs.toString()}`);
  }

  async getPayment(id: string): Promise<{ data: Payment }> {
    return this.request(`/v1/payments/${id}`);
  }

  async exportPayments(params: PaymentQuery = {}): Promise<Blob> {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v != null && v !== "") qs.set(k, String(v));
    });
    const res = await fetch(`/api/v1/payments/export?${qs.toString()}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    return res.blob();
  }

  async getSummary(from?: string, to?: string): Promise<AnalyticsSummary> {
    const qs = new URLSearchParams();
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    return this.request(`/v1/analytics/summary?${qs.toString()}`);
  }

  async getTimeseries(bucket?: string, from?: string, to?: string): Promise<TimeseriesBucket[]> {
    const qs = new URLSearchParams();
    if (bucket) qs.set("bucket", bucket);
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    const res = await this.request<{ data: TimeseriesBucket[] }>(
      `/v1/analytics/timeseries?${qs.toString()}`
    );
    return res.data;
  }

  async getByAgent(from?: string, to?: string): Promise<GroupedSpend[]> {
    const qs = new URLSearchParams();
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    const res = await this.request<{ data: GroupedSpend[] }>(
      `/v1/analytics/by-agent?${qs.toString()}`
    );
    return res.data;
  }

  async getByCategory(from?: string, to?: string): Promise<GroupedSpend[]> {
    const qs = new URLSearchParams();
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    const res = await this.request<{ data: GroupedSpend[] }>(
      `/v1/analytics/by-category?${qs.toString()}`
    );
    return res.data;
  }

  async getByEndpoint(from?: string, to?: string, limit?: number): Promise<GroupedSpend[]> {
    const qs = new URLSearchParams();
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    if (limit) qs.set("limit", String(limit));
    const res = await this.request<{ data: GroupedSpend[] }>(
      `/v1/analytics/by-endpoint?${qs.toString()}`
    );
    return res.data;
  }

  async getByNetwork(from?: string, to?: string): Promise<GroupedSpend[]> {
    const qs = new URLSearchParams();
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    const res = await this.request<{ data: GroupedSpend[] }>(
      `/v1/analytics/by-network?${qs.toString()}`
    );
    return res.data;
  }

  async getAgents(): Promise<Agent[]> {
    const res = await this.request<{ data: Agent[] }>("/v1/agents");
    return res.data;
  }

  async getAgent(id: string): Promise<Agent> {
    const res = await this.request<{ data: Agent }>(`/v1/agents/${id}`);
    return res.data;
  }

  async getAlerts(params: AlertQuery = {}): Promise<PaginatedResponse<Alert>> {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v != null && v !== "") qs.set(k, String(v));
    });
    return this.request(`/v1/alerts?${qs.toString()}`);
  }

  async resolveAlert(id: string): Promise<void> {
    await this.request(`/v1/alerts/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ resolved: true }),
    });
  }

  async getPolicies(): Promise<Policy[]> {
    const res = await this.request<{ data: Policy[] }>("/v1/policies");
    return res.data;
  }

  async createPolicy(data: {
    name: string;
    agent_external_id?: string | null;
    policy: unknown;
    is_active?: boolean;
  }): Promise<Policy> {
    return this.request("/v1/policies", { method: "POST", body: JSON.stringify(data) });
  }

  async updatePolicy(
    id: string,
    data: {
      name?: string;
      agent_external_id?: string | null;
      policy?: unknown;
      is_active?: boolean;
    }
  ): Promise<Policy> {
    return this.request(`/v1/policies/${id}`, { method: "PUT", body: JSON.stringify(data) });
  }

  async deletePolicy(id: string): Promise<void> {
    await this.request(`/v1/policies/${id}`, { method: "DELETE" });
  }

  async getTeam(): Promise<Team> {
    return this.request("/v1/team");
  }

  async rotateKey(): Promise<{ apiKey: string }> {
    return this.request("/v1/team/rotate-key", { method: "POST" });
  }

  // Alert Channels
  async getAlertChannels(): Promise<AlertChannel[]> {
    const res = await this.request<{ data: AlertChannel[] }>("/v1/alert-channels");
    return res.data;
  }

  async createAlertChannel(data: Omit<AlertChannel, "id" | "teamId" | "createdAt" | "updatedAt">): Promise<AlertChannel> {
    return this.request("/v1/alert-channels", { method: "POST", body: JSON.stringify(data) });
  }

  async updateAlertChannel(id: string, data: Partial<AlertChannel>): Promise<AlertChannel> {
    return this.request(`/v1/alert-channels/${id}`, { method: "PUT", body: JSON.stringify(data) });
  }

  async deleteAlertChannel(id: string): Promise<void> {
    await this.request(`/v1/alert-channels/${id}`, { method: "DELETE" });
  }

  async testAlertChannel(id: string): Promise<{ ok: boolean; message?: string; error?: string }> {
    return this.request(`/v1/alert-channels/${id}/test`, { method: "POST" });
  }

  // Scheduled Reports
  async getScheduledReports(): Promise<ScheduledReport[]> {
    const res = await this.request<{ data: ScheduledReport[] }>("/v1/scheduled-reports");
    return res.data;
  }

  async createScheduledReport(data: Omit<ScheduledReport, "id" | "teamId" | "lastSentAt" | "createdAt" | "updatedAt">): Promise<ScheduledReport> {
    return this.request("/v1/scheduled-reports", { method: "POST", body: JSON.stringify(data) });
  }

  async updateScheduledReport(id: string, data: Partial<ScheduledReport>): Promise<ScheduledReport> {
    return this.request(`/v1/scheduled-reports/${id}`, { method: "PUT", body: JSON.stringify(data) });
  }

  async deleteScheduledReport(id: string): Promise<void> {
    await this.request(`/v1/scheduled-reports/${id}`, { method: "DELETE" });
  }

  // Custom Dashboards
  async getCustomDashboards(): Promise<CustomDashboard[]> {
    const res = await this.request<{ data: CustomDashboard[] }>("/v1/custom-dashboards");
    return res.data;
  }

  async createCustomDashboard(data: { name?: string; layout?: unknown[] }): Promise<CustomDashboard> {
    return this.request("/v1/custom-dashboards", { method: "POST", body: JSON.stringify(data) });
  }

  async updateCustomDashboard(id: string, data: { name?: string; layout?: unknown[] }): Promise<CustomDashboard> {
    return this.request(`/v1/custom-dashboards/${id}`, { method: "PUT", body: JSON.stringify(data) });
  }

  async deleteCustomDashboard(id: string): Promise<void> {
    await this.request(`/v1/custom-dashboards/${id}`, { method: "DELETE" });
  }

  // Receipts
  async getReceipts(params?: {
    agentId?: string;
    endpoint?: string;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: Receipt[]; total: number }> {
    const sp = new URLSearchParams();
    if (params?.agentId) sp.set("agentId", params.agentId);
    if (params?.endpoint) sp.set("endpoint", params.endpoint);
    if (params?.from) sp.set("from", params.from);
    if (params?.to) sp.set("to", params.to);
    if (params?.limit) sp.set("limit", String(params.limit));
    if (params?.offset) sp.set("offset", String(params.offset));
    const qs = sp.toString();
    return this.request(`/v1/receipts${qs ? `?${qs}` : ""}`);
  }

  async getReceipt(id: string): Promise<{ data: Receipt }> {
    return this.request(`/v1/receipts/${id}`);
  }

  async verifyReceipt(id: string): Promise<{ valid: boolean; receipt: Omit<Receipt, "teamId"> }> {
    return this.request(`/v1/receipts/${id}/verify`);
  }

  async lookupReceipts(params: { responseHash?: string; endpoint?: string }): Promise<{ data: Receipt[] }> {
    const sp = new URLSearchParams();
    if (params.responseHash) sp.set("responseHash", params.responseHash);
    if (params.endpoint) sp.set("endpoint", params.endpoint);
    return this.request(`/v1/receipts/lookup?${sp.toString()}`);
  }

  async shareReceipt(id: string): Promise<{ url: string }> {
    return this.request(`/v1/receipts/${id}/share`, { method: "POST" });
  }
}

export { SentinelAPI };
