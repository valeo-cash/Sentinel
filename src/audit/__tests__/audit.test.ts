import { describe, it, expect, beforeEach } from "vitest";
import { AuditLogger } from "../index";
import { MemoryStorage } from "../storage/memory";
import { toCSV, toJSON, toSummaryReport } from "../export";
import type { AuditRecord } from "../../types/audit";
import type { PaymentContext } from "../../types/index";
import type { BudgetViolation } from "../../types/budget";

function makeRecord(overrides: Partial<AuditRecord> = {}): Omit<AuditRecord, "id" | "created_at"> {
  return {
    agent_id: "agent-1",
    team: "data-ops",
    human_sponsor: "alice@co.com",
    amount: "1.00",
    amount_raw: "1000000",
    asset: "USDC",
    network: "eip155:8453",
    scheme: "exact",
    tx_hash: "0xabc123",
    payer_address: "0xPayer",
    payee_address: "0xPayee",
    facilitator: null,
    endpoint: "https://api.example.com/data",
    method: "GET",
    status_code: 200,
    response_time_ms: 150,
    policy_id: null,
    policy_evaluation: "allowed",
    budget_remaining: "4.00",
    task_id: null,
    session_id: null,
    metadata: {},
    settled_at: Date.now(),
    tags: [],
    ...overrides,
  };
}

describe("AuditLogger", () => {
  let logger: AuditLogger;

  beforeEach(() => {
    logger = new AuditLogger({ enabled: true, storage: new MemoryStorage() });
  });

  it("logs a record and retrieves it", async () => {
    const record = await logger.log(makeRecord());
    expect(record.id).toHaveLength(16);
    expect(record.agent_id).toBe("agent-1");

    const results = await logger.query({ agentId: "agent-1" });
    expect(results).toHaveLength(1);
    expect(results[0]!.id).toBe(record.id);
  });

  it("queries by team", async () => {
    await logger.log(makeRecord({ team: "data-ops" }));
    await logger.log(makeRecord({ team: "ml-ops", agent_id: "agent-2" }));

    const results = await logger.query({ team: "data-ops" });
    expect(results).toHaveLength(1);
    expect(results[0]!.team).toBe("data-ops");
  });

  it("queries by time range", async () => {
    const now = Date.now();
    await logger.log(makeRecord());

    const results = await logger.query({ startTime: now - 1000, endTime: now + 10000 });
    expect(results.length).toBeGreaterThanOrEqual(1);

    const futureResults = await logger.query({ startTime: now + 100000 });
    expect(futureResults).toHaveLength(0);
  });

  it("produces summary statistics", async () => {
    await logger.log(makeRecord({ amount: "1.00", amount_raw: "1000000" }));
    await logger.log(makeRecord({ amount: "2.00", amount_raw: "2000000", agent_id: "agent-2" }));

    const summary = await logger.summarize();
    expect(summary.total_transactions).toBe(2);
    expect(summary.total_spend).toBe("3.00");
    expect(summary.unique_agents).toBe(2);
  });

  it("redacts specified fields", async () => {
    const redactLogger = new AuditLogger({
      enabled: true,
      storage: new MemoryStorage(),
      redactFields: ["secret_key"],
    });

    const record = await redactLogger.log(
      makeRecord({ metadata: { secret_key: "hunter2", public_field: "visible" } }),
    );
    expect(record.metadata["secret_key"]).toBe("[REDACTED]");
    expect(record.metadata["public_field"]).toBe("visible");
  });

  it("does not throw when disabled", async () => {
    const disabledLogger = new AuditLogger({ enabled: false });
    const record = await disabledLogger.log(makeRecord());
    expect(record.id).toBeTruthy();
  });

  it("logs blocked payment attempts", async () => {
    const context: PaymentContext = {
      endpoint: "https://api.example.com/data",
      method: "GET",
      agentId: "agent-1",
      team: "data-ops",
      amount: "100.00",
      amountRaw: "100000000",
      asset: "USDC",
      network: "eip155:8453",
      scheme: "exact",
      payTo: "0xPayee",
      timestamp: Date.now(),
      metadata: {},
    };

    const violation: BudgetViolation = {
      type: "per_call",
      limit: "10.00",
      current: "0.00",
      attempted: "100.00",
      agentId: "agent-1",
      endpoint: "https://api.example.com/data",
      timestamp: Date.now(),
    };

    const record = await logger.logBlocked(context, violation, {});
    expect(record.policy_evaluation).toBe("blocked");
    expect(record.metadata["violation_type"]).toBe("per_call");
  });
});

describe("MemoryStorage", () => {
  it("respects FIFO eviction at max capacity", async () => {
    const storage = new MemoryStorage(3);
    const records = Array.from({ length: 5 }, (_, i) =>
      ({
        ...makeRecord({ agent_id: `agent-${i}` }),
        id: `id-${i}`,
        created_at: Date.now() + i,
      }) as AuditRecord,
    );

    for (const r of records) {
      await storage.write(r);
    }

    expect(await storage.getById("id-0")).toBeNull();
    expect(await storage.getById("id-1")).toBeNull();
    expect(await storage.getById("id-2")).not.toBeNull();
    expect(await storage.getById("id-3")).not.toBeNull();
    expect(await storage.getById("id-4")).not.toBeNull();
  });
});

describe("export", () => {
  const records: AuditRecord[] = [
    {
      ...makeRecord(),
      id: "abc123",
      created_at: 1700000000000,
    } as AuditRecord,
  ];

  it("toCSV produces valid CSV with headers", () => {
    const csv = toCSV(records);
    const lines = csv.trim().split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain("id,agent_id");
    expect(lines[1]).toContain("abc123");
  });

  it("toJSON produces valid JSON", () => {
    const json = toJSON(records, true);
    const parsed = JSON.parse(json);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe("abc123");
  });

  it("toSummaryReport produces readable report", () => {
    const summary = {
      total_spend: "3.00",
      total_transactions: 2,
      unique_endpoints: 1,
      unique_agents: 2,
      avg_payment: "1.50",
      max_payment: "2.00",
      by_agent: { "agent-1": { spend: "1.00", count: 1 } },
      by_endpoint: { "https://api.example.com/data": { spend: "3.00", count: 2 } },
      by_team: { "data-ops": { spend: "3.00", count: 2 } },
      violations: 0,
      period: { start: 1700000000000, end: 1700003600000 },
    };

    const report = toSummaryReport(summary);
    expect(report).toContain("VALEO SENTINEL");
    expect(report).toContain("$3.00");
    expect(report).toContain("agent-1");
  });
});
