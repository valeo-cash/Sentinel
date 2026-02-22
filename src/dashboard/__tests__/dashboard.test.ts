import { describe, it, expect, beforeEach } from "vitest";
import { SentinelDashboard } from "../index";
import { spendByAgent, spendByTeam, topSpenders, violations, anomalies } from "../queries";
import { MemoryStorage } from "../../audit/storage/memory";
import type { AuditRecord } from "../../types/audit";

function makeRecord(overrides: Partial<AuditRecord> = {}): AuditRecord {
  const now = Date.now();
  return {
    id: `id-${Math.random().toString(36).slice(2, 10)}`,
    agent_id: "agent-1",
    team: "data-ops",
    human_sponsor: "alice@co.com",
    amount: "1.00",
    amount_raw: "1000000",
    asset: "USDC",
    network: "eip155:8453",
    scheme: "exact",
    tx_hash: "0xabc",
    payer_address: "0xPayer",
    payee_address: "0xPayee",
    facilitator: null,
    endpoint: "https://api.example.com/data",
    method: "GET",
    status_code: 200,
    response_time_ms: 100,
    policy_id: null,
    policy_evaluation: "allowed",
    budget_remaining: null,
    task_id: null,
    session_id: null,
    metadata: {},
    created_at: now,
    settled_at: now,
    tags: [],
    ...overrides,
  };
}

async function seedStorage(storage: MemoryStorage): Promise<void> {
  const now = Date.now();
  await storage.write(makeRecord({ agent_id: "bot-1", team: "data-ops", amount: "1.00", created_at: now - 1000 }));
  await storage.write(makeRecord({ agent_id: "bot-1", team: "data-ops", amount: "2.50", created_at: now - 500 }));
  await storage.write(makeRecord({ agent_id: "bot-2", team: "ml-ops", amount: "5.00", endpoint: "https://api.other.com/ml", created_at: now - 200 }));
  await storage.write(makeRecord({ agent_id: "bot-3", team: "data-ops", amount: "0.50", policy_evaluation: "blocked", created_at: now - 100 }));
  await storage.write(makeRecord({ agent_id: "bot-2", team: "ml-ops", amount: "3.00", policy_evaluation: "flagged", created_at: now - 50 }));
}

describe("dashboard queries", () => {
  let storage: MemoryStorage;

  beforeEach(async () => {
    storage = new MemoryStorage();
    await seedStorage(storage);
  });

  it("spendByAgent returns correct totals", async () => {
    const result = await spendByAgent(storage, "bot-1", "last_hour");
    expect(result.count).toBe(2);
    expect(result.spend).toBe("3.50");
  });

  it("spendByTeam returns correct totals", async () => {
    const result = await spendByTeam(storage, "data-ops", "last_hour");
    expect(result.count).toBe(3); // bot-1 x2 + bot-3
    expect(result.spend).toBe("4.00");
  });

  it("topSpenders ranks agents by spend", async () => {
    const result = await topSpenders(storage, 3, "last_hour");
    expect(result[0]!.agentId).toBe("bot-2"); // 5.00 + 3.00 = 8.00
    expect(result[0]!.spend).toBe("8.00");
    expect(result[1]!.agentId).toBe("bot-1"); // 1.00 + 2.50 = 3.50
  });

  it("violations returns only blocked records", async () => {
    const result = await violations(storage, "last_hour");
    expect(result).toHaveLength(1);
    expect(result[0]!.agent_id).toBe("bot-3");
  });

  it("anomalies returns only flagged records", async () => {
    const result = await anomalies(storage, "last_hour");
    expect(result).toHaveLength(1);
    expect(result[0]!.agent_id).toBe("bot-2");
  });

  it("handles custom time range", async () => {
    const now = Date.now();
    const result = await spendByAgent(storage, "bot-1", { start: now - 2000, end: now });
    expect(result.count).toBe(2);
  });

  it("returns empty results for non-matching queries", async () => {
    const result = await spendByAgent(storage, "nonexistent-agent", "last_hour");
    expect(result.count).toBe(0);
    expect(result.spend).toBe("0.00");
  });
});

describe("SentinelDashboard", () => {
  let storage: MemoryStorage;
  let dashboard: SentinelDashboard;

  beforeEach(async () => {
    storage = new MemoryStorage();
    await seedStorage(storage);
    dashboard = new SentinelDashboard({ storage });
  });

  it("getSpend returns aggregated report", async () => {
    const report = await dashboard.getSpend({ range: "last_hour" });
    expect(report.count).toBe(5);
    expect(report.totalSpend).toBe("12.00");
    expect(Object.keys(report.byAgent)).toHaveLength(3);
  });

  it("getSpend filters by agent", async () => {
    const report = await dashboard.getSpend({ agentId: "bot-1", range: "last_hour" });
    expect(report.count).toBe(2);
    expect(report.totalSpend).toBe("3.50");
  });

  it("getSpend filters by team", async () => {
    const report = await dashboard.getSpend({ team: "ml-ops", range: "last_hour" });
    expect(report.count).toBe(2);
    expect(report.totalSpend).toBe("8.00");
  });

  it("getAgents returns all agent summaries", async () => {
    const agents = await dashboard.getAgents();
    expect(agents).toHaveLength(3);
    const bot2 = agents.find((a) => a.agentId === "bot-2");
    expect(bot2).toBeTruthy();
    expect(bot2!.totalSpend).toBe("8.00");
    expect(bot2!.transactionCount).toBe(2);
  });

  it("getAlerts returns violations and anomalies", async () => {
    const alerts = await dashboard.getAlerts();
    expect(alerts).toHaveLength(2);
    const violationAlerts = alerts.filter((a) => a.type === "violation");
    const anomalyAlerts = alerts.filter((a) => a.type === "anomaly");
    expect(violationAlerts).toHaveLength(1);
    expect(anomalyAlerts).toHaveLength(1);
  });

  it("sync returns stub result", async () => {
    const result = await dashboard.sync();
    expect(result.synced).toBe(0);
  });
});
