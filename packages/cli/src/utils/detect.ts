import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type Framework = "nextjs" | "express" | "langchain" | "vercel-ai" | "other";

export interface ProjectInfo {
  hasPackageJson: boolean;
  name: string;
  framework: Framework;
  hasTypeScript: boolean;
}

export function readProjectPackageJson(cwd: string): Record<string, unknown> | null {
  const pkgPath = join(cwd, "package.json");
  if (!existsSync(pkgPath)) return null;
  try {
    return JSON.parse(readFileSync(pkgPath, "utf-8"));
  } catch {
    return null;
  }
}

export function detectFramework(cwd: string): Framework {
  const pkg = readProjectPackageJson(cwd);
  const deps = {
    ...(pkg?.dependencies as Record<string, string> | undefined),
    ...(pkg?.devDependencies as Record<string, string> | undefined),
  };

  if (
    existsSync(join(cwd, "next.config.js")) ||
    existsSync(join(cwd, "next.config.ts")) ||
    existsSync(join(cwd, "next.config.mjs"))
  ) {
    return "nextjs";
  }

  if (deps["next"]) return "nextjs";
  if (deps["express"]) return "express";
  if (deps["langchain"] || deps["@langchain/core"]) return "langchain";
  if (deps["ai"] || deps["@ai-sdk/openai"]) return "vercel-ai";

  return "other";
}

export function detectPackageManager(cwd: string): "pnpm" | "yarn" | "npm" {
  if (existsSync(join(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(join(cwd, "yarn.lock"))) return "yarn";
  return "npm";
}

export function hasTypeScript(cwd: string): boolean {
  return existsSync(join(cwd, "tsconfig.json"));
}

export const frameworkLabels: Record<Framework, string> = {
  nextjs: "Next.js",
  express: "Express",
  langchain: "LangChain",
  "vercel-ai": "Vercel AI",
  other: "Other",
};

export const frameworkPackages: Record<Framework, string[]> = {
  nextjs: ["@x402sentinel/x402", "@x402sentinel/next"],
  express: ["@x402sentinel/x402", "@x402sentinel/express"],
  langchain: ["@x402sentinel/x402", "@x402sentinel/langchain"],
  "vercel-ai": ["@x402sentinel/x402", "@x402sentinel/vercel-ai"],
  other: ["@x402sentinel/x402"],
};

export const SENTINEL_BASE_URL = "https://sentinel.valeocash.com";
