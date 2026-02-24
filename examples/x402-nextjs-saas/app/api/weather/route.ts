import { withSentinel } from "@x402sentinel/next";

export const GET = withSentinel(async (req, sentinelFetch) => {
  return Response.json({
    location: "Berlin",
    temperature: "8\u00B0C",
    condition: "Cloudy",
    timestamp: new Date().toISOString(),
  });
});
