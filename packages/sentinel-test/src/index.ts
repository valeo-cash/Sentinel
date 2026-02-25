#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { testEndpoint } from "./tester.js";
import { displayResults } from "./display.js";

const banner = `
${chalk.bold.cyan("  🛡  Sentinel x402 Endpoint Tester")}
${chalk.dim("  Test any x402 payment endpoint")}
`;

const program = new Command();

program
  .name("sentinel-test")
  .description("Test any x402 payment endpoint")
  .version("0.1.0")
  .argument("<url>", "URL of the x402 endpoint to test")
  .option("--network <network>", "Expected network (base, solana, etc)")
  .option("--verbose", "Show full response details")
  .option("--json", "Output results as JSON")
  .option("--timeout <ms>", "Request timeout in ms", "10000")
  .action(async (url: string, opts: Record<string, string | boolean | undefined>) => {
    if (!opts.json) {
      console.log(banner);
    }

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `https://${url}`;
    }

    const result = await testEndpoint(url, {
      network: opts.network as string | undefined,
      verbose: !!opts.verbose,
      timeout: Number(opts.timeout) || 10000,
    });

    if (opts.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      displayResults(result, { verbose: !!opts.verbose });
    }

    process.exit(result.score >= 5 ? 0 : 1);
  });

program.parse();
