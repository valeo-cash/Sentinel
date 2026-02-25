import chalk from "chalk";
import ora from "ora";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { SENTINEL_BASE_URL } from "../utils/detect.js";

export async function statusCommand() {
  const cwd = process.cwd();
  const apiKey = getApiKey(cwd);

  if (!apiKey) {
    printAnonymousMessage();
    return;
  }

  const spinner = ora("Fetching status...").start();

  try {
    const headers = { Authorization: `Bearer ${apiKey}` };

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [teamRes, todayRes, monthRes] = await Promise.all([
      fetch(`${SENTINEL_BASE_URL}/api/v1/team`, { headers }),
      fetch(
        `${SENTINEL_BASE_URL}/api/v1/analytics/summary?from=${todayStart.toISOString()}&to=${now.toISOString()}`,
        { headers }
      ),
      fetch(
        `${SENTINEL_BASE_URL}/api/v1/analytics/summary?from=${monthStart.toISOString()}&to=${now.toISOString()}`,
        { headers }
      ),
    ]);

    if (!teamRes.ok) {
      spinner.fail("Invalid API key");
      console.log(
        chalk.dim(
          "\nGet a new one at sentinel.valeocash.com/dashboard/settings\n"
        )
      );
      return;
    }

    const team = await teamRes.json();
    const today = todayRes.ok ? await todayRes.json() : null;
    const month = monthRes.ok ? await monthRes.json() : null;

    spinner.stop();

    console.log(chalk.bold("\n🛡  Sentinel Status\n"));
    console.log(`   Team:          ${chalk.white(team.name || team.id)}`);
    console.log(`   Plan:          ${chalk.white(team.plan || "Free")}\n`);

    if (today) {
      console.log(chalk.bold("   Today:"));
      console.log(`   ├─ Payments    ${fmt(today.total_payments)}`);
      console.log(`   ├─ Spend       ${chalk.yellow("$" + fmtMoney(today.total_spent_usd))}`);
      console.log(`   ├─ Agents      ${fmt(today.active_agents)} active`);
      console.log(`   └─ Endpoints   ${fmt(today.unique_endpoints)}\n`);
    }

    if (month) {
      console.log(chalk.bold("   This Month:"));
      console.log(`   ├─ Payments    ${fmt(month.total_payments)}`);
      console.log(`   ├─ Spend       ${chalk.yellow("$" + fmtMoney(month.total_spent_usd))}`);
      console.log(`   ├─ Failed      ${fmt(month.total_failed)}`);
      console.log(`   └─ Blocked     ${fmt(month.total_blocked)}\n`);
    }

    console.log(
      `   Dashboard: ${chalk.cyan("sentinel.valeocash.com/dashboard")}\n`
    );
  } catch {
    spinner.fail("Failed to reach Sentinel API");
  }
}

function getApiKey(cwd: string): string | null {
  const envPath = join(cwd, ".env");
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, "utf-8");
    const match = content.match(/^SENTINEL_API_KEY=(.*)$/m);
    if (match) {
      const value = match[1].trim();
      if (value && value !== "anonymous") return value;
    }
  }

  for (const name of ["sentinel.config.ts", "sentinel.config.js"]) {
    const cfgPath = join(cwd, name);
    if (existsSync(cfgPath)) {
      const content = readFileSync(cfgPath, "utf-8");
      const match = content.match(/apiKey:\s*["']([^"']+)["']/);
      if (match && match[1] !== "anonymous") return match[1];
    }
  }

  return null;
}

function fmt(n: unknown): string {
  const num = Number(n) || 0;
  return num.toLocaleString("en-US");
}

function fmtMoney(n: unknown): string {
  const num = Number(n) || 0;
  return num.toFixed(2);
}

function printAnonymousMessage() {
  console.log(
    `\n${chalk.yellow("⚠")} Running in anonymous mode.\n\n` +
      "   To see your stats, add an API key:\n" +
      `   1. Go to ${chalk.cyan("sentinel.valeocash.com/dashboard/settings")}\n` +
      "   2. Create an API key\n" +
      "   3. Add to .env: SENTINEL_API_KEY=your-key\n" +
      "   4. Run: npx create-sentinel status\n"
  );
}
