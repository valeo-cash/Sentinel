import { withSentinel } from "@x402sentinel/next";

export const GET = withSentinel(async (req, sentinelFetch) => {
  return Response.json({
    summary: "This is a summarized version of the content.",
    words: 142,
    timestamp: new Date().toISOString(),
  });
});
