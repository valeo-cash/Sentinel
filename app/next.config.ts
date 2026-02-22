import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@x402sentinel/x402"],
};

export default nextConfig;
