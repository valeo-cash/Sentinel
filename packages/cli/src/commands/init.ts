import chalk from "chalk";
import ora from "ora";
import prompts from "prompts";
import { execSync } from "node:child_process";
import {
  existsSync,
  readFileSync,
  writeFileSync,
  appendFileSync,
  mkdirSync,
} from "node:fs";
import { join } from "node:path";
import { banner } from "../utils/banner.js";
import {
  detectFramework,
  detectPackageManager,
  hasTypeScript,
  readProjectPackageJson,
  frameworkLabels,
  frameworkPackages,
  type Framework,
} from "../utils/detect.js";

export async function initCommand() {
  const cwd = process.cwd();

  console.log(banner);

  // --- Detect project ---
  const pkg = readProjectPackageJson(cwd);
  if (!pkg) {
    console.log(
      chalk.yellow("⚠ No package.json found. Make sure you're in a Node.js project.\n")
    );
  }

  let framework = detectFramework(cwd);

  if (framework === "other") {
    const response = await prompts({
      type: "select",
      name: "framework",
      message: "What framework are you using?",
      choices: [
        { title: "Next.js", value: "nextjs" },
        { title: "Express", value: "express" },
        { title: "LangChain", value: "langchain" },
        { title: "Vercel AI", value: "vercel-ai" },
        { title: "Other", value: "other" },
      ],
    });
    if (!response.framework) process.exit(1);
    framework = response.framework as Framework;
  } else {
    console.log(
      chalk.green(`✓ Detected ${frameworkLabels[framework]} project\n`)
    );
  }

  // --- Ask questions ---
  const projectName = (pkg?.name as string) || "my-agent";
  const suffix = Math.random().toString(36).substring(2, 6);
  const defaultAgentId = `${projectName}-${suffix}`;

  const answers = await prompts([
    {
      type: "text",
      name: "agentId",
      message: "Agent ID for this project?",
      initial: defaultAgentId,
    },
    {
      type: "confirm",
      name: "hasKey",
      message: "Do you have a Sentinel API key?",
      initial: false,
    },
  ]);

  if (answers.agentId === undefined) process.exit(1);

  let apiKey = "anonymous";

  if (answers.hasKey) {
    const keyAnswer = await prompts({
      type: "text",
      name: "key",
      message: "Paste your API key:",
    });
    if (keyAnswer.key) apiKey = keyAnswer.key;
  } else {
    console.log(
      chalk.dim(
        "\nNo problem — Sentinel works without one.\nGet one later at https://sentinel.valeocash.com/dashboard/settings\n"
      )
    );
  }

  // --- Install packages ---
  const pm = detectPackageManager(cwd);
  const packages = frameworkPackages[framework];
  const installCmd =
    pm === "yarn"
      ? `yarn add ${packages.join(" ")}`
      : `${pm} install ${packages.join(" ")}`;

  const spinner = ora(`Installing ${packages.join(", ")}...`).start();
  try {
    execSync(installCmd, { cwd, stdio: "pipe" });
    spinner.succeed(`Installed ${packages.join(", ")}`);
  } catch {
    spinner.fail("Failed to install packages");
    console.log(chalk.dim(`  Run manually: ${installCmd}\n`));
  }

  // --- Create config file ---
  const useTs = hasTypeScript(cwd);
  const configName = useTs ? "sentinel.config.ts" : "sentinel.config.js";
  const configPath = join(cwd, configName);

  const configExport = useTs ? "export default" : "module.exports =";
  const configContent = `${configExport} {
  agentId: "${answers.agentId}",
  apiKey: process.env.SENTINEL_API_KEY || "anonymous",
  baseUrl: "https://sentinel.valeocash.com",
};
`;

  writeFileSync(configPath, configContent);
  console.log(chalk.green(`✓ Created ${configName}`));

  // --- Create example usage file ---
  const exampleFile = createExampleFile(cwd, framework, useTs);
  if (exampleFile) {
    console.log(chalk.green(`✓ Created ${exampleFile}`));
  }

  // --- Add env vars ---
  const envPath = join(cwd, ".env");
  const envKey = `SENTINEL_API_KEY=${apiKey}`;

  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, "utf-8");
    if (!envContent.includes("SENTINEL_API_KEY")) {
      appendFileSync(envPath, `\n${envKey}\n`);
    }
  } else {
    writeFileSync(envPath, `${envKey}\n`);
  }
  console.log(chalk.green("✓ Added SENTINEL_API_KEY to .env"));

  const envExamplePath = join(cwd, ".env.example");
  if (existsSync(envExamplePath)) {
    const content = readFileSync(envExamplePath, "utf-8");
    if (!content.includes("SENTINEL_API_KEY")) {
      appendFileSync(envExamplePath, "\nSENTINEL_API_KEY=\n");
    }
  }

  // --- Update .gitignore ---
  const gitignorePath = join(cwd, ".gitignore");
  if (existsSync(gitignorePath)) {
    const content = readFileSync(gitignorePath, "utf-8");
    if (!content.includes(".env")) {
      appendFileSync(gitignorePath, "\n.env\n");
    }
  } else {
    writeFileSync(gitignorePath, ".env\n");
  }
  console.log(chalk.green("✓ Ensured .env is in .gitignore"));

  // --- Success ---
  console.log(
    `\n${chalk.bold.green("Setup complete!")}\n\n` +
      chalk.bold("Next steps:\n") +
      `  1. Import sentinelFetch from ${exampleFile || configName}\n` +
      "  2. Use it instead of fetch for x402 calls\n" +
      `  3. View your data:\n     ${chalk.cyan(`https://sentinel.valeocash.com/agent/${answers.agentId}`)}\n` +
      `  4. Claim your dashboard:\n     ${chalk.cyan(`https://sentinel.valeocash.com/register?agent=${answers.agentId}`)}\n` +
      `  5. Generate compliance reports:\n     ${chalk.cyan("https://sentinel.valeocash.com/dashboard/compliance")}\n\n` +
      chalk.dim('Run "npx create-sentinel doctor" to verify your setup.\n')
  );
}

function ensureDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function createExampleFile(
  cwd: string,
  framework: Framework,
  useTs: boolean
): string | null {
  const ext = useTs ? ".ts" : ".js";

  switch (framework) {
    case "nextjs": {
      ensureDir(join(cwd, "lib"));
      const filePath = `lib/sentinel${ext}`;
      writeFileSync(
        join(cwd, filePath),
        useTs
          ? `import { sentinel } from "@x402sentinel/x402";
import config from "../sentinel.config";

export const sentinelFetch = sentinel(globalThis.fetch, {
  agentId: config.agentId,
  apiKey: config.apiKey,
});
`
          : `const { sentinel } = require("@x402sentinel/x402");
const config = require("../sentinel.config");

const sentinelFetch = sentinel(globalThis.fetch, {
  agentId: config.agentId,
  apiKey: config.apiKey,
});

module.exports = { sentinelFetch };
`
      );
      return filePath;
    }
    case "express": {
      ensureDir(join(cwd, "middleware"));
      const filePath = `middleware/sentinel${ext}`;
      writeFileSync(
        join(cwd, filePath),
        useTs
          ? `import { sentinelMiddleware } from "@x402sentinel/express";
import config from "../sentinel.config";

export default sentinelMiddleware({
  agentId: config.agentId,
  apiKey: config.apiKey,
});
`
          : `const { sentinelMiddleware } = require("@x402sentinel/express");
const config = require("../sentinel.config");

module.exports = sentinelMiddleware({
  agentId: config.agentId,
  apiKey: config.apiKey,
});
`
      );
      return filePath;
    }
    default: {
      const filePath = `sentinel${ext}`;
      writeFileSync(
        join(cwd, filePath),
        useTs
          ? `import { sentinel } from "@x402sentinel/x402";
import config from "./sentinel.config";

export const sentinelFetch = sentinel(globalThis.fetch, {
  agentId: config.agentId,
  apiKey: config.apiKey,
});
`
          : `const { sentinel } = require("@x402sentinel/x402");
const config = require("./sentinel.config");

const sentinelFetch = sentinel(globalThis.fetch, {
  agentId: config.agentId,
  apiKey: config.apiKey,
});

module.exports = { sentinelFetch };
`
      );
      return filePath;
    }
  }
}
