import type { PaymentRequired, PaymentRequirements, SettleResponse } from "../types/x402-stubs";
import { formatUSDC } from "../utils/money";

/**
 * Decode the PAYMENT-REQUIRED header from a 402 response.
 * The header value is a Base64-encoded JSON string containing the PaymentRequired object.
 */
export function parsePaymentRequired(header: string): PaymentRequired {
  const json = Buffer.from(header, "base64").toString("utf-8");
  return JSON.parse(json) as PaymentRequired;
}

/**
 * Parse a payment header that may be base64-encoded JSON or raw JSON.
 * Handles both `payment-required` and `x-payment` header formats.
 * Returns null if unparseable.
 */
export function parsePaymentHeader(header: string): PaymentRequired | null {
  try {
    return JSON.parse(Buffer.from(header, "base64").toString("utf-8")) as PaymentRequired;
  } catch {
    try {
      return JSON.parse(header) as PaymentRequired;
    } catch {
      return null;
    }
  }
}

/**
 * Convert a raw base-unit amount string (e.g. "1000000") to a
 * human-readable USDC string (e.g. "1.000000").
 * USDC has 6 decimal places.
 */
export function normalizeAmountToUSDC(raw: string): string {
  return formatUSDC(BigInt(raw));
}

/**
 * Decode the PAYMENT-RESPONSE header from a successful (200) response.
 * The header value is a Base64-encoded JSON string containing the SettleResponse.
 * Returns null if the header is missing or unparseable.
 */
export function parsePaymentResponse(header: string | null): SettleResponse | null {
  if (!header) return null;
  try {
    const json = Buffer.from(header, "base64").toString("utf-8");
    return JSON.parse(json) as SettleResponse;
  } catch {
    return null;
  }
}

/**
 * Extract the payment amount, asset, network, and scheme from a PaymentRequirements object.
 * Uses the first entry in the accepts array.
 */
export function extractAmount(requirements: PaymentRequirements): {
  amount: string;
  asset: string;
  network: string;
  scheme: string;
} {
  return {
    amount: requirements.amount,
    asset: requirements.asset,
    network: requirements.network,
    scheme: requirements.scheme,
  };
}

/**
 * Extract payment info from a PaymentRequired object (the full 402 response).
 * Picks the first accepted payment requirement.
 */
export function extractFromPaymentRequired(paymentRequired: PaymentRequired): {
  amount: string;
  asset: string;
  network: string;
  scheme: string;
  payTo: string;
} | null {
  const first = paymentRequired.accepts[0];
  if (!first) return null;
  return {
    amount: first.amount,
    asset: first.asset,
    network: first.network,
    scheme: first.scheme,
    payTo: first.payTo,
  };
}
