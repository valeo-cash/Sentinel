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
}

export { SentinelAPI };
