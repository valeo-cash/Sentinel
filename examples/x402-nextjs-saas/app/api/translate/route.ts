import { withSentinel } from "@x402sentinel/next";

export const GET = withSentinel(async (req, sentinelFetch) => {
  return Response.json({
    original: "Hello world",
    translated: "Hallo Welt",
    language: "de",
    timestamp: new Date().toISOString(),
  });
});
