import chalk from "chalk";
import ora from "ora";
import { SENTINEL_BASE_URL } from "../utils/detect.js";

interface ReceiptData {
  id: string;
  agentId: string;
  endpoint: string;
  amount: string;
  currency: string;
  network: string;
  txHash: string | null;
  requestHash: string;
  responseHash: string;
  sentinelSignature: string;
  createdAt: string;
  verified?: boolean;
}

export async function inspectCommand(id: string) {
  if (id.startsWith("sr_")) {
    await inspectReceipt(id);
  } else if (id.startsWith("0x")) {
    await inspectTxHash(id);
  } else {
    console.log(
      chalk.red("\n✗ Provide a receipt ID (sr_...) or transaction hash (0x...)\n")
    );
    process.exit(1);
  }
}

async function inspectReceipt(receiptId: string) {
  const spinner = ora("Fetching receipt...").start();

  try {
    const res = await fetch(
      `${SENTINEL_BASE_URL}/api/v1/receipts/${receiptId}/verify`
    );

    if (!res.ok) {
      spinner.stop();
      printNotFound(receiptId);
      return;
    }

    const data = await res.json();
    spinner.stop();
    printReceipt(data.receipt, data.valid);
  } catch {
    spinner.fail("Failed to reach Sentinel API");
  }
}

async function inspectTxHash(txHash: string) {
  const spinner = ora("Looking up transaction...").start();

  try {
    const res = await fetch(
      `${SENTINEL_BASE_URL}/api/v1/receipts/lookup?txHash=${encodeURIComponent(txHash)}`
    );

    if (!res.ok) {
      spinner.stop();
      printNotFound(txHash);
      return;
    }

    const data = await res.json();
    if (!data.data || data.data.length === 0) {
      spinner.stop();
      printNotFound(txHash);
      return;
    }

    spinner.stop();
    printReceipt(data.data[0], true);
  } catch {
    spinner.fail("Failed to reach Sentinel API");
  }
}

function truncateHash(hash: string | null, len = 12): string {
  if (!hash) return "—";
  if (hash.length <= len * 2) return hash;
  return `${hash.slice(0, len)}...${hash.slice(-len)}`;
}

function formatAmount(amount: string, currency: string): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return `${amount} ${currency}`;
  return `$${num.toFixed(4)} ${currency}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }) +
    " " +
    d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "UTC",
    }) +
    " UTC";
}

function printReceipt(receipt: ReceiptData, valid: boolean) {
  const status = valid
    ? chalk.green("VERIFIED")
    : chalk.red("INVALID");
  const statusIcon = valid ? "✅" : "❌";

  const w = 47;
  const border = chalk.cyan;

  const pad = (label: string, value: string) => {
    const raw = `  ${label.padEnd(12)} ${value}`;
    const padded = raw.padEnd(w - 2);
    return `${border("│")} ${padded}${border("│")}`;
  };

  const empty = `${border("│")} ${"".padEnd(w - 2)}${border("│")}`;
  const top = border(`┌${"─".repeat(w)}┐`);
  const mid = border(`├${"─".repeat(w)}┤`);
  const bot = border(`└${"─".repeat(w)}┘`);

  const headerLine1 = `  🛡  SENTINEL RECEIPT`;
  const headerLine2 = `  Status: ${statusIcon} ${status}`;

  console.log(`
${top}
${border("│")} ${headerLine1.padEnd(w - 2)}${border("│")}
${border("│")} ${headerLine2.padEnd(w - 2)}${border("│")}
${mid}
${empty}
${pad("Receipt", chalk.cyan(receipt.id))}
${pad("Agent", receipt.agentId)}
${pad("Endpoint", receipt.endpoint)}
${pad("Amount", chalk.yellow(formatAmount(receipt.amount, receipt.currency)))}
${pad("Network", receipt.network)}
${pad("Tx Hash", chalk.dim(truncateHash(receipt.txHash)))}
${empty}
${pad("Request", chalk.dim(`sha256:${truncateHash(receipt.requestHash)}`))}
${pad("Response", chalk.dim(`sha256:${truncateHash(receipt.responseHash)}`))}
${pad("Signature", chalk.dim(`hmac:${truncateHash(receipt.sentinelSignature)}`))}
${empty}
${pad("Timestamp", formatDate(receipt.createdAt))}
${empty}
${pad("Verify:", chalk.cyan("sentinel.valeocash.com/receipt/"))}
${pad("", chalk.cyan(receipt.id))}
${bot}
`);
}

function printNotFound(id: string) {
  console.log(
    `\n${chalk.red("✗")} No receipt found for: ${chalk.dim(id)}\n\n` +
      "  This could mean:\n" +
      "  - The payment wasn't tracked by Sentinel\n" +
      "  - The transaction hash is incorrect\n" +
      "  - The receipt hasn't been generated yet\n"
  );
}
