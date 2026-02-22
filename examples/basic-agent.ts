/**
 * Basic Agent Example
 *
 * Shows the minimal one-line integration: wrap your x402 fetch with Sentinel.
 * This example uses a mock endpoint since we don't need a real x402 server.
 */

import {
  wrapWithSentinel,
  standardPolicy,
  SentinelBudgetError,
  MemoryStorage,
} from "../src/index";

// In a real app you'd do:
//   import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
//   import { registerExactEvmScheme } from "@x402/evm/exact/client";
//   const client = new x402Client();
//   registerExactEvmScheme(client, { signer });
//   const fetchWithPayment = wrapFetchWithPayment(fetch, client);

// For this example, we mock the x402-wrapped fetch to simulate payment responses.
function createMockFetchWithPayment(): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const settlement = {
      success: true,
      transaction: "0x" + Math.random().toString(16).slice(2, 18),
      network: "eip155:8453",
      payer: "0xYourWallet",
    };

    return new Response(JSON.stringify({ weather: "sunny", temp: 72 }), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "payment-response": Buffer.from(JSON.stringify(settlement)).toString("base64"),
      },
    });
  };
}

async function main() {
  const fetchWithPayment = createMockFetchWithPayment();

  // --- ONE LINE to add Sentinel ---
  const secureFetch = wrapWithSentinel(fetchWithPayment, {
    agentId: "agent-weather-001",
    team: "data-ops",
    humanSponsor: "alice@company.com",
    budget: standardPolicy(),
    audit: {
      enabled: true,
      storage: new MemoryStorage(),
    },
  });

  // Use exactly like before — the API is identical to fetch
  console.log("Making a paid API call...\n");
  const response = await secureFetch("https://api.weather.com/v1/current?city=NYC");

  console.log("Status:", response.status);
  const data = await response.json();
  console.log("Data:", data);
  console.log("\n--- Sentinel is silently logging the audit trail ---");
}

main().catch(console.error);
