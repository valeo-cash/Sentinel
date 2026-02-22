import { describe, it, expect } from "vitest";
import { BudgetManager } from "../index";
import { SpikeDetector } from "../spike-detector";
import {
  conservativePolicy,
  standardPolicy,
  liberalPolicy,
  unlimitedPolicy,
  customPolicy,
} from "../policies";
import type { PaymentContext } from "../../types/index";

function makeContext(overrides: Partial<PaymentContext> = {}): PaymentContext {
  return {
    endpoint: "https://api.example.com/data",
    method: "GET",
    agentId: "test-agent",
    team: null,
    amount: "0.50",
    amountRaw: "500000",
    asset: "USDC",
    network: "eip155:8453",
    scheme: "exact",
    payTo: "0xRecipient",
    timestamp: Date.now(),
    metadata: {},
    ...overrides,
  };
}

describe("BudgetManager", () => {
  describe("per-call limits", () => {
    it("allows payment under per-call limit", () => {
      const mgr = new BudgetManager({ maxPerCall: "1.00" });
      const result = mgr.evaluate(makeContext({ amount: "0.50" }));
      expect(result.allowed).toBe(true);
    });

    it("allows payment exactly at per-call limit", () => {
      const mgr = new BudgetManager({ maxPerCall: "1.00" });
      const result = mgr.evaluate(makeContext({ amount: "1.00" }));
      expect(result.allowed).toBe(true);
    });

    it("blocks payment over per-call limit", () => {
      const mgr = new BudgetManager({ maxPerCall: "1.00" });
      const result = mgr.evaluate(makeContext({ amount: "1.01" }));
      expect(result.allowed).toBe(false);
      if (!result.allowed) {
        expect(result.violation.type).toBe("per_call");
        expect(result.violation.limit).toBe("1.00");
      }
    });
  });

  describe("hourly limits", () => {
    it("allows when under hourly limit", () => {
      const mgr = new BudgetManager({ maxPerHour: "5.00" });
      mgr.record("2.00", "https://api.example.com/data");
      const result = mgr.evaluate(makeContext({ amount: "2.00" }));
      expect(result.allowed).toBe(true);
    });

    it("blocks when hourly limit would be exceeded", () => {
      const mgr = new BudgetManager({ maxPerHour: "5.00" });
      mgr.record("4.00", "https://api.example.com/data");
      const result = mgr.evaluate(makeContext({ amount: "2.00" }));
      expect(result.allowed).toBe(false);
      if (!result.allowed) {
        expect(result.violation.type).toBe("hourly");
      }
    });
  });

  describe("daily limits", () => {
    it("blocks when daily limit would be exceeded", () => {
      const mgr = new BudgetManager({ maxPerDay: "10.00" });
      mgr.record("8.00", "https://api.example.com/data");
      const result = mgr.evaluate(makeContext({ amount: "3.00" }));
      expect(result.allowed).toBe(false);
      if (!result.allowed) {
        expect(result.violation.type).toBe("daily");
      }
    });
  });

  describe("total lifetime cap", () => {
    it("blocks when total cap would be exceeded", () => {
      const mgr = new BudgetManager({ maxTotal: "100.00" });
      mgr.record("95.00", "https://api.example.com/data");
      const result = mgr.evaluate(makeContext({ amount: "6.00" }));
      expect(result.allowed).toBe(false);
      if (!result.allowed) {
        expect(result.violation.type).toBe("total");
      }
    });
  });

  describe("endpoint filtering", () => {
    it("blocks endpoints on the blocklist", () => {
      const mgr = new BudgetManager({
        blockedEndpoints: ["https://evil.com/*"],
      });
      const result = mgr.evaluate(
        makeContext({ endpoint: "https://evil.com/steal", amount: "0.01" }),
      );
      expect(result.allowed).toBe(false);
      if (!result.allowed) {
        expect(result.violation.type).toBe("blocked_endpoint");
      }
    });

    it("allows endpoints not on the blocklist", () => {
      const mgr = new BudgetManager({
        blockedEndpoints: ["https://evil.com/*"],
      });
      const result = mgr.evaluate(
        makeContext({ endpoint: "https://good.com/data", amount: "0.01" }),
      );
      expect(result.allowed).toBe(true);
    });

    it("blocks endpoints not on the allowlist", () => {
      const mgr = new BudgetManager({
        allowedEndpoints: ["https://trusted.com/*"],
      });
      const result = mgr.evaluate(
        makeContext({ endpoint: "https://unknown.com/data", amount: "0.01" }),
      );
      expect(result.allowed).toBe(false);
    });

    it("allows endpoints on the allowlist", () => {
      const mgr = new BudgetManager({
        allowedEndpoints: ["https://trusted.com/*"],
      });
      const result = mgr.evaluate(
        makeContext({ endpoint: "https://trusted.com/api/v1", amount: "0.01" }),
      );
      expect(result.allowed).toBe(true);
    });
  });

  describe("approval threshold", () => {
    it("blocks when payment exceeds approval threshold", () => {
      const mgr = new BudgetManager({
        requireApproval: {
          above: "5.00",
          handler: async () => true,
        },
      });
      const result = mgr.evaluate(makeContext({ amount: "6.00" }));
      expect(result.allowed).toBe(false);
      if (!result.allowed) {
        expect(result.violation.type).toBe("approval_required");
      }
    });
  });

  describe("state management", () => {
    it("tracks call count", () => {
      const mgr = new BudgetManager({});
      mgr.record("1.00", "/a");
      mgr.record("2.00", "/b");
      expect(mgr.getState().callCount).toBe(2);
    });

    it("serializes and deserializes", () => {
      const mgr = new BudgetManager({ maxPerCall: "5.00" });
      mgr.record("1.00", "/a");
      mgr.record("2.00", "/b");

      const serialized = mgr.serialize();
      const restored = BudgetManager.deserialize(serialized, { maxPerCall: "5.00" });
      expect(restored.getState().totalSpent).toBe(mgr.getState().totalSpent);
      expect(restored.getState().callCount).toBe(2);
    });

    it("resets hourly counter", () => {
      const mgr = new BudgetManager({});
      mgr.record("5.00", "/a");
      mgr.reset("hourly");
      expect(mgr.getState().hourlySpent).toBe("0.000000");
      // total should remain
      expect(mgr.getState().totalSpent).toBe("5.000000");
    });

    it("resets total counter", () => {
      const mgr = new BudgetManager({});
      mgr.record("5.00", "/a");
      mgr.reset("total");
      expect(mgr.getState().totalSpent).toBe("0.000000");
      expect(mgr.getState().callCount).toBe(0);
    });
  });

  describe("unlimited policy", () => {
    it("allows everything", () => {
      const mgr = new BudgetManager(unlimitedPolicy());
      const result = mgr.evaluate(makeContext({ amount: "99999.00" }));
      expect(result.allowed).toBe(true);
    });
  });
});

describe("SpikeDetector", () => {
  it("does not flag with fewer than 3 data points", () => {
    const sd = new SpikeDetector(3.0);
    sd.record("1.00");
    sd.record("1.00");
    expect(sd.check("100.00")).toBeNull();
  });

  it("flags a spike after enough data", () => {
    const sd = new SpikeDetector(3.0);
    sd.record("1.00");
    sd.record("1.00");
    sd.record("1.00");
    const result = sd.check("10.00");
    expect(result).not.toBeNull();
    expect(result).toContain("10.0x");
  });

  it("does not flag normal payments", () => {
    const sd = new SpikeDetector(3.0);
    sd.record("1.00");
    sd.record("1.50");
    sd.record("1.25");
    expect(sd.check("2.00")).toBeNull();
  });

  it("respects custom threshold", () => {
    const sd = new SpikeDetector(5.0);
    sd.record("1.00");
    sd.record("1.00");
    sd.record("1.00");
    // 4x average — under 5.0 threshold
    expect(sd.check("4.00")).toBeNull();
    // 6x average — over 5.0 threshold
    expect(sd.check("6.00")).not.toBeNull();
  });
});

describe("preset policies", () => {
  it("conservative policy has tight limits", () => {
    const p = conservativePolicy();
    expect(p.maxPerCall).toBe("0.10");
    expect(p.maxPerHour).toBe("5.00");
    expect(p.maxPerDay).toBe("50.00");
  });

  it("standard policy has moderate limits", () => {
    const p = standardPolicy();
    expect(p.maxPerCall).toBe("1.00");
    expect(p.maxPerHour).toBe("25.00");
  });

  it("liberal policy has high limits", () => {
    const p = liberalPolicy();
    expect(p.maxPerCall).toBe("10.00");
  });

  it("custom policy overrides defaults", () => {
    const p = customPolicy({ maxPerCall: "50.00" });
    expect(p.maxPerCall).toBe("50.00");
    expect(p.maxPerHour).toBe("25.00"); // inherits standard
  });
});
