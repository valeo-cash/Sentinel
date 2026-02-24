import chalk from "chalk";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { SENTINEL_BASE_URL } from "../utils/detect.js";

interface CheckResult {
  pass: boolean;
  warn?: boolean;
  message: string;
}

export async function doctorCommand() {
  const cwd = process.cwd();
  let passed = 0;
  const total = 6;

  console.log(chalk.bold("\n🛡  Sentinel Doctor\n"));

  // 1. Package installed
  const pkgCheck = checkPackageInstalled(cwd);
  printCheck(pkgCheck);
  if (pkgCheck.pass) passed++;

  // 2. Config file
  const configCheck = checkConfigFile(cwd);
  printCheck(configCheck);
  if (configCheck.pass) passed++;

  // 3. API key
  const apiKeyCheck = checkApiKey(cwd);
  printCheck(apiKeyCheck);
  if (apiKeyCheck.pass) passed++;

  // 4. Sentinel reachable
  const reachableCheck = await checkSentinelReachable();
  printCheck(reachableCheck);
  if (reachableCheck.pass) passed++;

  // 5. API key valid
  const apiKey = getApiKey(cwd);
  const validCheck = await checkApiKeyValid(apiKey);
  printCheck(validCheck);
  if (validCheck.pass) passed++;

  // 6. Framework package
  const fwCheck = checkFrameworkPackage(cwd);
  printCheck(fwCheck);
  if (fwCheck.pass) passed++;

  // Summary
  console.log(`\n${chalk.bold(`${passed}/${total} checks passed`)}\n`);

  if (passed === total) {
    console.log(
      "Your Sentinel setup is ready. Run your app and make\n" +
        "an x402 payment — it will show up at:\n" +
        chalk.cyan("sentinel.valeocash.com/dashboard\n")
    );
  }
}

function printCheck(result: CheckResult) {
  if (result.pass && !result.warn) {
    console.log(chalk.green("✓") + " " + result.message);
  } else if (result.warn) {
    console.log(chalk.yellow("⚠") + " " + result.message);
  } else {
    console.log(chalk.red("✗") + " " + result.message);
  }
}

function checkPackageInstalled(cwd: string): CheckResult {
  const pkgPath = join(cwd, "node_modules", "@x402sentinel", "x402", "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      return { pass: true, message: `@x402sentinel/x402 installed (v${pkg.version})` };
    } catch {
      return { pass: true, message: "@x402sentinel/x402 installed" };
    }
  }
  return {
    pass: false,
    message: "@x402sentinel/x402 not found — run: npx create-sentinel init",
  };
}

function checkConfigFile(cwd: string): CheckResult {
  if (existsSync(join(cwd, "sentinel.config.ts"))) {
    return { pass: true, message: "sentinel.config.ts found" };
  }
  if (existsSync(join(cwd, "sentinel.config.js"))) {
    return { pass: true, message: "sentinel.config.js found" };
  }
  return {
    pass: false,
    message: "No config file — run: npx create-sentinel init",
  };
}

function checkApiKey(cwd: string): CheckResult {
  const envPath = join(cwd, ".env");
  if (!existsSync(envPath)) {
    return { pass: false, message: "SENTINEL_API_KEY not found" };
  }

  const content = readFileSync(envPath, "utf-8");
  const match = content.match(/^SENTINEL_API_KEY=(.*)$/m);
  if (!match) {
    return { pass: false, message: "SENTINEL_API_KEY not found in .env" };
  }

  const value = match[1].trim();
  if (value === "anonymous" || value === "") {
    return {
      pass: true,
      warn: true,
      message:
        'SENTINEL_API_KEY is "anonymous" — works but data won\'t be linked to your account',
    };
  }

  return { pass: true, message: "SENTINEL_API_KEY found in .env" };
}

function getApiKey(cwd: string): string | null {
  const envPath = join(cwd, ".env");
  if (!existsSync(envPath)) return null;
  const content = readFileSync(envPath, "utf-8");
  const match = content.match(/^SENTINEL_API_KEY=(.*)$/m);
  if (!match) return null;
  const value = match[1].trim();
  return value && value !== "anonymous" ? value : null;
}

async function checkSentinelReachable(): Promise<CheckResult> {
  try {
    const start = Date.now();
    const res = await fetch(`${SENTINEL_BASE_URL}/api/v1/health`);
    const elapsed = Date.now() - start;
    if (res.ok) {
      return { pass: true, message: `Sentinel API reachable (${elapsed}ms)` };
    }
    return { pass: false, message: "Cannot reach Sentinel API — check your network" };
  } catch {
    return { pass: false, message: "Cannot reach Sentinel API — check your network" };
  }
}

async function checkApiKeyValid(apiKey: string | null): Promise<CheckResult> {
  if (!apiKey) {
    return {
      pass: true,
      warn: true,
      message: "API key validation skipped (anonymous mode)",
    };
  }

  try {
    const res = await fetch(`${SENTINEL_BASE_URL}/api/v1/team`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (res.ok) {
      const data = await res.json();
      return {
        pass: true,
        message: `API key valid — Team: "${data.name || data.id}"`,
      };
    }
    return {
      pass: false,
      message:
        "API key invalid — get a new one at sentinel.valeocash.com/dashboard/settings",
    };
  } catch {
    return {
      pass: false,
      message: "Could not validate API key — Sentinel API unreachable",
    };
  }
}

function checkFrameworkPackage(cwd: string): CheckResult {
  const fwPackages = ["next", "express", "langchain", "vercel-ai"];
  for (const fw of fwPackages) {
    const pkgPath = join(
      cwd,
      "node_modules",
      "@x402sentinel",
      fw,
      "package.json"
    );
    if (existsSync(pkgPath)) {
      return { pass: true, message: `@x402sentinel/${fw} installed` };
    }
  }
  return { pass: true, warn: true, message: "No framework package (optional)" };
}
