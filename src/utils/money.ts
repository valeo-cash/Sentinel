/** USDC has 6 decimal places: 1 USDC = 1_000_000 base units */
export const USDC_DECIMALS = 6;
const USDC_SCALE = 10n ** BigInt(USDC_DECIMALS);

/**
 * Parse a human-readable USDC string (e.g., "1.50") into base units as bigint.
 * Handles integers, decimals with up to 6 places, and leading/trailing zeros.
 */
export function parseUSDC(human: string): bigint {
  const trimmed = human.trim();
  if (trimmed === "") {
    throw new Error("Cannot parse empty string as USDC amount");
  }

  const negative = trimmed.startsWith("-");
  if (negative) {
    throw new Error(
      `Negative USDC amounts are not allowed: "${human}"`
    );
  }

  const dotIndex = trimmed.indexOf(".");
  if (dotIndex === -1) {
    return BigInt(trimmed) * USDC_SCALE;
  }

  const wholePart = trimmed.slice(0, dotIndex) || "0";
  let fracPart = trimmed.slice(dotIndex + 1);

  if (fracPart.length > USDC_DECIMALS) {
    throw new Error(
      `USDC amount "${human}" exceeds ${USDC_DECIMALS} decimal places`
    );
  }

  fracPart = fracPart.padEnd(USDC_DECIMALS, "0");
  return BigInt(wholePart) * USDC_SCALE + BigInt(fracPart);
}

/** Format base units to a full 6-decimal USDC string (e.g., 1500000n -> "1.500000") */
export function formatUSDC(raw: bigint): string {
  const isNeg = raw < 0n;
  const abs = isNeg ? -raw : raw;
  const whole = abs / USDC_SCALE;
  const frac = abs % USDC_SCALE;
  const fracStr = frac.toString().padStart(USDC_DECIMALS, "0");
  return `${isNeg ? "-" : ""}${whole}.${fracStr}`;
}

/** Format base units to a trimmed human-readable string (e.g., 1500000n -> "1.50") */
export function formatUSDCHuman(raw: bigint): string {
  const full = formatUSDC(raw);
  const dotIndex = full.indexOf(".");
  if (dotIndex === -1) return full;

  let end = full.length;
  while (end > dotIndex + 3 && full[end - 1] === "0") {
    end--;
  }
  return full.slice(0, end);
}

/** Add two human-readable USDC amounts, return human-readable result */
export function addUSDC(a: string, b: string): string {
  return formatUSDC(parseUSDC(a) + parseUSDC(b));
}

/** Subtract b from a (both human-readable USDC), return human-readable result */
export function subtractUSDC(a: string, b: string): string {
  return formatUSDC(parseUSDC(a) - parseUSDC(b));
}

/** Compare two human-readable USDC amounts. Returns -1, 0, or 1. */
export function compareUSDC(a: string, b: string): -1 | 0 | 1 {
  const diff = parseUSDC(a) - parseUSDC(b);
  if (diff < 0n) return -1;
  if (diff > 0n) return 1;
  return 0;
}

/** Check if spent exceeds limit (both human-readable USDC strings) */
export function isOverBudget(spent: string, limit: string): boolean {
  return parseUSDC(spent) > parseUSDC(limit);
}

/** Calculate the average of human-readable USDC amounts. Returns "0.000000" for empty array. */
export function calculateAverage(amounts: string[]): string {
  if (amounts.length === 0) return formatUSDC(0n);
  let sum = 0n;
  for (const a of amounts) {
    sum += parseUSDC(a);
  }
  return formatUSDC(sum / BigInt(amounts.length));
}
