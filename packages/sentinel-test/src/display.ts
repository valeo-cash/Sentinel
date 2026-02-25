import chalk from "chalk";
import type { TestResult, TestCheck } from "./tester.js";

export interface DisplayOptions {
  verbose?: boolean;
}

export function displayResults(result: TestResult, options: DisplayOptions = {}) {
  console.log();

  // Score header
  const scoreColor = result.score >= 8 ? chalk.green : result.score >= 5 ? chalk.yellow : chalk.red;
  console.log(
    chalk.bold("  URL:   ") + chalk.cyan(result.url)
  );
  console.log(
    chalk.bold("  Score: ") + scoreColor.bold(`${result.score}/10`) +
    chalk.dim(`  (${result.totalTime}ms)`)
  );
  console.log();

  // Checks
  const passed = result.checks.filter((c) => c.passed);
  const failed = result.checks.filter((c) => !c.passed);

  if (failed.length > 0) {
    console.log(chalk.bold.red("  ISSUES"));
    console.log();
    for (const check of failed) {
      printCheck(check);
    }
    console.log();
  }

  if (passed.length > 0) {
    console.log(chalk.bold.green("  PASSED"));
    console.log();
    for (const check of passed) {
      printCheck(check);
    }
    console.log();
  }

  // Payment details
  if (result.paymentDetails) {
    const pd = result.paymentDetails;
    console.log(chalk.bold("  PAYMENT DETAILS"));
    console.log();
    console.log(`    Amount:       ${chalk.white.bold(pd.amount)} ${chalk.dim(pd.currency)}`);
    console.log(`    Network:      ${chalk.white(pd.network)}`);
    console.log(`    Receiver:     ${chalk.dim(pd.receiver)}`);
    if (pd.facilitator) {
      console.log(`    Facilitator:  ${chalk.dim(pd.facilitator)}`);
    }
    console.log();
  }

  // Summary line
  const critFail = result.checks.filter((c) => !c.passed && c.severity === "critical").length;
  const warnFail = result.checks.filter((c) => !c.passed && c.severity === "warning").length;

  const parts: string[] = [
    chalk.green(`${passed.length} passed`),
  ];
  if (critFail > 0) parts.push(chalk.red(`${critFail} critical`));
  if (warnFail > 0) parts.push(chalk.yellow(`${warnFail} warnings`));

  console.log(`  ${parts.join(chalk.dim("  ·  "))}`);
  console.log();
}

function printCheck(check: TestCheck) {
  const icon = check.passed ? chalk.green("✓") : check.severity === "critical" ? chalk.red("✗") : chalk.yellow("!");
  const label = check.passed ? chalk.white(check.name) : severityColor(check)(check.name);

  let line = `    ${icon}  ${label}`;

  if (check.value) {
    line += chalk.dim(`  →  ${check.value}`);
  }

  if (!check.passed && check.expected) {
    line += chalk.dim(`  (expected: ${check.expected})`);
  }

  console.log(line);
}

function severityColor(check: TestCheck) {
  if (check.severity === "critical") return chalk.red;
  if (check.severity === "warning") return chalk.yellow;
  return chalk.dim;
}
