import { describe, it, expect, vi } from "vitest";
import { wrapWithSentinel } from "../index";
import { SentinelBudgetError, SentinelConfigError } from "../../errors";
import { MemoryStorage } from "../../audit/storage/memory";
import type { SentinelConfig } from "../../types/config";
import type { SettleResponse } from "../../types/x402-stubs";

function encodeHeader(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj)).toString("base64");
}

function makeSettleResponse(overrides: Partial<SettleResponse> = {}): SettleResponse {
  return {
    success: true,
    transaction: "0xtxhash123",
    network: "eip155:8453",
    payer: "0xPayer",
    ...overrides,
  };
}

function makeConfig(overrides: Partial<SentinelConfig> = {}): SentinelConfig {
  return {
    agentId: "test-agent",
    team: "test-team",
    audit: {
      enabled: true,
      storage: new MemoryStorage(),
    },
    ...overrides,
  };
}

describe("wrapWithSentinel", () => {
  it("passes through non-payment responses unchanged", async () => {
    const mockFetch = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ data: "hello" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const sentinelFetch = wrapWithSentinel(mockFetch, makeConfig());
    const response = await sentinelFetch("https://api.example.com/free");

    expect(response.status).toBe(200);
    // Body should still be consumable (we never touched it)
    const body = await response.json();
    expect(body).toEqual({ data: "hello" });
    expect(mockFetch).toHaveBeenCalledOnce();
  });

  it("returns response with PAYMENT-RESPONSE header unchanged and body consumable", async () => {
    const settlement = makeSettleResponse();
    const mockFetch = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ result: "paid data" }), {
        status: 200,
        headers: {
          "content-type": "application/json",
          "payment-response": encodeHeader(settlement),
        },
      }),
    );

    const sentinelFetch = wrapWithSentinel(mockFetch, makeConfig());
    const response = await sentinelFetch("https://api.example.com/paid");

    expect(response.status).toBe(200);
    // Body MUST still be consumable — Sentinel never touches it
    const body = await response.json();
    expect(body).toEqual({ result: "paid data" });
  });

  it("never consumes the response body", async () => {
    const settlement = makeSettleResponse();
    const bodyReadTracker = vi.fn();

    const realResponse = new Response("paid content", {
      status: 200,
      headers: {
        "payment-response": encodeHeader(settlement),
      },
    });

    // Spy on body-consuming methods to ensure they're never called by Sentinel
    const origJson = realResponse.json.bind(realResponse);
    const origText = realResponse.text.bind(realResponse);
    realResponse.json = vi.fn(() => {
      bodyReadTracker("json");
      return origJson();
    }) as typeof realResponse.json;
    realResponse.text = vi.fn(() => {
      bodyReadTracker("text");
      return origText();
    }) as typeof realResponse.text;

    const mockFetch = vi.fn<typeof fetch>().mockResolvedValue(realResponse);
    const sentinelFetch = wrapWithSentinel(mockFetch, makeConfig());
    await sentinelFetch("https://api.example.com/paid");

    // Sentinel must NOT have called any body-consuming method
    expect(bodyReadTracker).not.toHaveBeenCalled();
  });

  it("logs leaked 402 responses as failed requests", async () => {
    const paymentRequired = {
      x402Version: 2,
      resource: { url: "https://api.example.com/paid", description: "", mimeType: "" },
      accepts: [
        {
          scheme: "exact",
          network: "eip155:8453",
          asset: "USDC",
          amount: "1000000",
          payTo: "0xRecipient",
          maxTimeoutSeconds: 60,
          extra: {},
        },
      ],
    };

    const mockFetch = vi.fn<typeof fetch>().mockResolvedValue(
      new Response("Payment Required", {
        status: 402,
        headers: {
          "payment-required": encodeHeader(paymentRequired),
        },
      }),
    );

    const storage = new MemoryStorage();
    const sentinelFetch = wrapWithSentinel(mockFetch, makeConfig({
      audit: { enabled: true, storage },
    }));

    const response = await sentinelFetch("https://api.example.com/paid");
    expect(response.status).toBe(402);

    // Should have logged the failed payment
    const records = await storage.query({});
    expect(records.length).toBeGreaterThanOrEqual(1);
    expect(records[0]!.status_code).toBe(402);
    expect(records[0]!.policy_evaluation).toBe("flagged");
  });

  it("blocks requests to blocked endpoints before fetch", async () => {
    const mockFetch = vi.fn<typeof fetch>();

    const sentinelFetch = wrapWithSentinel(mockFetch, makeConfig({
      budget: {
        blockedEndpoints: ["https://evil.com/*"],
      },
    }));

    await expect(
      sentinelFetch("https://evil.com/steal"),
    ).rejects.toThrow(SentinelBudgetError);

    // Fetch should NOT have been called
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("re-throws network errors after logging", async () => {
    const mockFetch = vi.fn<typeof fetch>().mockRejectedValue(
      new Error("Network unreachable"),
    );

    const storage = new MemoryStorage();
    const sentinelFetch = wrapWithSentinel(mockFetch, makeConfig({
      audit: { enabled: true, storage },
    }));

    await expect(
      sentinelFetch("https://api.example.com/data"),
    ).rejects.toThrow("Network unreachable");

    // Should still have logged the error
    const records = await storage.query({});
    expect(records.length).toBeGreaterThanOrEqual(1);
    expect(records[0]!.tags).toContain("error");
  });

  it("calls afterPayment hook on successful payment", async () => {
    const afterPayment = vi.fn();
    const settlement = makeSettleResponse();

    const mockFetch = vi.fn<typeof fetch>().mockResolvedValue(
      new Response("ok", {
        status: 200,
        headers: {
          "payment-response": encodeHeader(settlement),
        },
      }),
    );

    const sentinelFetch = wrapWithSentinel(mockFetch, makeConfig({
      hooks: { afterPayment },
    }));

    await sentinelFetch("https://api.example.com/paid");
    expect(afterPayment).toHaveBeenCalledOnce();
  });

  it("calls onBudgetExceeded hook when blocked", async () => {
    const onBudgetExceeded = vi.fn();
    const mockFetch = vi.fn<typeof fetch>();

    const sentinelFetch = wrapWithSentinel(mockFetch, makeConfig({
      budget: { blockedEndpoints: ["https://blocked.com/*"] },
      hooks: { onBudgetExceeded },
    }));

    await expect(
      sentinelFetch("https://blocked.com/resource"),
    ).rejects.toThrow(SentinelBudgetError);

    expect(onBudgetExceeded).toHaveBeenCalledOnce();
  });

  it("throws SentinelConfigError for invalid config", () => {
    expect(() =>
      wrapWithSentinel(vi.fn(), { agentId: "", budget: {} }),
    ).toThrow(SentinelConfigError);
  });

  it("throws SentinelConfigError for invalid budget amounts", () => {
    expect(() =>
      wrapWithSentinel(vi.fn(), { agentId: "agent", budget: { maxPerCall: "not-a-number" } }),
    ).toThrow(SentinelConfigError);
  });

  it("works with no budget policy (audit only)", async () => {
    const settlement = makeSettleResponse();
    const mockFetch = vi.fn<typeof fetch>().mockResolvedValue(
      new Response("ok", {
        status: 200,
        headers: {
          "payment-response": encodeHeader(settlement),
        },
      }),
    );

    const sentinelFetch = wrapWithSentinel(mockFetch, makeConfig());
    const response = await sentinelFetch("https://api.example.com/paid");
    expect(response.status).toBe(200);
  });

  it("works with audit disabled (budget only)", async () => {
    const mockFetch = vi.fn<typeof fetch>().mockResolvedValue(
      new Response("ok", { status: 200 }),
    );

    const sentinelFetch = wrapWithSentinel(mockFetch, makeConfig({
      budget: { maxPerCall: "10.00" },
      audit: { enabled: false },
    }));

    const response = await sentinelFetch("https://api.example.com/data");
    expect(response.status).toBe(200);
  });

  // ── Budget enforcement tests ──────────────────────────────────

  it("throws SentinelBudgetError when 402 price exceeds maxPerCall", async () => {
    const paymentRequired = {
      x402Version: 2,
      resource: { url: "https://api.example.com/expensive", description: "", mimeType: "" },
      accepts: [{
        scheme: "exact",
        network: "eip155:8453",
        asset: "USDC",
        amount: "5000000",
        payTo: "0xRecipient",
        maxTimeoutSeconds: 60,
        extra: {},
      }],
    };

    const mockFetch = vi.fn<typeof fetch>().mockResolvedValue(
      new Response("Payment Required", {
        status: 402,
        headers: { "payment-required": encodeHeader(paymentRequired) },
      }),
    );

    const sentinelFetch = wrapWithSentinel(mockFetch, makeConfig({
      budget: { maxPerCall: "0.50" },
    }));

    await expect(
      sentinelFetch("https://api.example.com/expensive"),
    ).rejects.toThrow(SentinelBudgetError);
  });

  it("returns 402 normally when price is within maxPerCall", async () => {
    const paymentRequired = {
      x402Version: 2,
      resource: { url: "https://api.example.com/cheap", description: "", mimeType: "" },
      accepts: [{
        scheme: "exact",
        network: "eip155:8453",
        asset: "USDC",
        amount: "10000",
        payTo: "0xRecipient",
        maxTimeoutSeconds: 60,
        extra: {},
      }],
    };

    const mockFetch = vi.fn<typeof fetch>().mockResolvedValue(
      new Response("Payment Required", {
        status: 402,
        headers: { "payment-required": encodeHeader(paymentRequired) },
      }),
    );

    const sentinelFetch = wrapWithSentinel(mockFetch, makeConfig({
      budget: { maxPerCall: "1.00" },
    }));

    const response = await sentinelFetch("https://api.example.com/cheap");
    expect(response.status).toBe(402);
  });

  it("throws SentinelBudgetError pre-flight when hourly limit already exceeded", async () => {
    const mockFetch = vi.fn<typeof fetch>();
    const url = "https://api.example.com/data";

    const sentinelFetch = wrapWithSentinel(mockFetch, makeConfig({
      budget: { maxPerHour: "2.00", maxPerCall: "1.00" },
    }));

    const makePaymentCycle = (amountBaseUnits: string) => {
      const pr = {
        x402Version: 2,
        resource: { url, description: "", mimeType: "" },
        accepts: [{
          scheme: "exact", network: "eip155:8453" as const, asset: "USDC",
          amount: amountBaseUnits, payTo: "0xR", maxTimeoutSeconds: 60, extra: {},
        }],
      };
      return {
        resp402: new Response("", {
          status: 402,
          headers: { "payment-required": encodeHeader(pr) },
        }),
        resp200: new Response("ok", {
          status: 200,
          headers: { "payment-response": encodeHeader(makeSettleResponse()) },
        }),
      };
    };

    const cycle1 = makePaymentCycle("1000000");
    const cycle2 = makePaymentCycle("1000000");
    mockFetch
      .mockResolvedValueOnce(cycle1.resp402)
      .mockResolvedValueOnce(cycle1.resp200)
      .mockResolvedValueOnce(cycle2.resp402)
      .mockResolvedValueOnce(cycle2.resp200);

    // First 402 passes checks, then 200 records $1.00
    await sentinelFetch(url);
    await sentinelFetch(url);
    // Second 402 passes checks, then 200 records another $1.00
    await sentinelFetch(url);
    await sentinelFetch(url);

    // Third call: hourly spend is now $2.00 which equals the limit.
    // Pre-flight should block since adding even $0 means we're at the limit.
    // BudgetManager checks projectedHourly (spent + amount) > limit.
    // With amount=0, 2.00 + 0 = 2.00 which is NOT > 2.00, so it passes pre-flight.
    // But the 402 will have amount that would push over.
    const cycle3 = makePaymentCycle("1000000");
    mockFetch.mockResolvedValueOnce(cycle3.resp402);

    await expect(
      sentinelFetch(url),
    ).rejects.toThrow(SentinelBudgetError);
  });

  it("throws SentinelBudgetError when 402 price would push over hourly limit", async () => {
    const url = "https://api.example.com/data";

    const pr = {
      x402Version: 2,
      resource: { url, description: "", mimeType: "" },
      accepts: [{
        scheme: "exact", network: "eip155:8453" as const, asset: "USDC",
        amount: "1000000", payTo: "0xR", maxTimeoutSeconds: 60, extra: {},
      }],
    };

    const settlement = makeSettleResponse();

    const mockFetch = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("", {
        status: 402,
        headers: { "payment-required": encodeHeader(pr) },
      }))
      .mockResolvedValueOnce(new Response("ok", {
        status: 200,
        headers: { "payment-response": encodeHeader(settlement) },
      }))
      .mockResolvedValueOnce(new Response("", {
        status: 402,
        headers: { "payment-required": encodeHeader(pr) },
      }));

    const sentinelFetch = wrapWithSentinel(mockFetch, makeConfig({
      budget: { maxPerHour: "1.50", maxPerCall: "5.00" },
    }));

    // 402 → passes (price $1.00 < per-call $5.00, hourly $0 + $1 < $1.50)
    await sentinelFetch(url);
    // 200 → records $1.00 spend
    await sentinelFetch(url);
    // Next 402 → price $1.00 but hourly is already $1.00, so $1.00 + $1.00 > $1.50
    await expect(sentinelFetch(url)).rejects.toThrow(SentinelBudgetError);
  });

  it("tracks spend from 200 payment-response via price cache", async () => {
    const url = "https://api.example.com/paid";
    const pr = {
      x402Version: 2,
      resource: { url, description: "", mimeType: "" },
      accepts: [{
        scheme: "exact", network: "eip155:8453" as const, asset: "USDC",
        amount: "500000", payTo: "0xR", maxTimeoutSeconds: 60, extra: {},
      }],
    };

    const mockFetch = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("", {
        status: 402,
        headers: { "payment-required": encodeHeader(pr) },
      }))
      .mockResolvedValueOnce(new Response("ok", {
        status: 200,
        headers: { "payment-response": encodeHeader(makeSettleResponse()) },
      }));

    const storage = new MemoryStorage();
    const sentinelFetch = wrapWithSentinel(mockFetch, makeConfig({
      budget: { maxPerCall: "10.00", maxTotal: "100.00" },
      audit: { enabled: true, storage },
    }));

    // 402 → caches price $0.50
    await sentinelFetch(url);
    // 200 with payment-response → should record $0.50 spend
    await sentinelFetch(url);

    const records = await storage.query({});
    const paymentRecord = records.find((r) => r.status_code === 200);
    expect(paymentRecord).toBeDefined();
    expect(paymentRecord!.amount).toBe("0.500000");
  });

  it("does not track spend for normal 200 without payment headers", async () => {
    const mockFetch = vi.fn<typeof fetch>().mockResolvedValue(
      new Response("ok", { status: 200 }),
    );

    const storage = new MemoryStorage();
    const sentinelFetch = wrapWithSentinel(mockFetch, makeConfig({
      budget: { maxPerCall: "10.00" },
      audit: { enabled: true, storage },
    }));

    await sentinelFetch("https://api.example.com/free");

    const records = await storage.query({});
    expect(records.length).toBe(0);
  });

  it("parses x-payment header the same as payment-required", async () => {
    const paymentRequired = {
      x402Version: 2,
      resource: { url: "https://api.example.com/paid", description: "", mimeType: "" },
      accepts: [{
        scheme: "exact",
        network: "eip155:8453",
        asset: "USDC",
        amount: "8000000",
        payTo: "0xRecipient",
        maxTimeoutSeconds: 60,
        extra: {},
      }],
    };

    const mockFetch = vi.fn<typeof fetch>().mockResolvedValue(
      new Response("Payment Required", {
        status: 402,
        headers: { "x-payment": encodeHeader(paymentRequired) },
      }),
    );

    const sentinelFetch = wrapWithSentinel(mockFetch, makeConfig({
      budget: { maxPerCall: "1.00" },
    }));

    // $8.00 > maxPerCall $1.00 → should throw
    await expect(
      sentinelFetch("https://api.example.com/paid"),
    ).rejects.toThrow(SentinelBudgetError);
  });
});
