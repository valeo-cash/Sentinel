import { sentinel } from "@x402sentinel/x402";

// One line. Every x402 payment is now tracked.
const fetch = sentinel(globalThis.fetch, {
  agentId: "starter-agent",
});

async function main() {
  console.log("\u{1F916} Agent starting...\n");

  // Call a paid x402 endpoint
  const response = await fetch("https://api.weather.com/forecast");

  if (response.ok) {
    const data = await response.json();
    console.log("\u2713 Data received:", JSON.stringify(data, null, 2));
    console.log("\n\u{1F4CA} Payment tracked by Sentinel");
    console.log("   View: https://sentinel.valeocash.com");
  } else {
    console.log("\u2717 Request failed:", response.status);
  }
}

main().catch(console.error);
