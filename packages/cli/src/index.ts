#!/usr/bin/env node

import { Command } from "commander";
import { banner } from "./utils/banner.js";
import { initCommand } from "./commands/init.js";
import { doctorCommand } from "./commands/doctor.js";
import { inspectCommand } from "./commands/inspect.js";
import { statusCommand } from "./commands/status.js";

const program = new Command();

program
  .name("sentinel")
  .description("Sentinel CLI — x402 payment audit trails")
  .version("0.1.3");

program
  .command("init")
  .description("Set up Sentinel in your project")
  .action(initCommand);

program
  .command("doctor")
  .description("Check your Sentinel setup")
  .action(doctorCommand);

program
  .command("inspect <id>")
  .description("Inspect a receipt or transaction")
  .action(inspectCommand);

program
  .command("status")
  .description("View your team's payment stats")
  .action(statusCommand);

program.action(() => {
  console.log(banner);
  program.help();
});

program.parse();
