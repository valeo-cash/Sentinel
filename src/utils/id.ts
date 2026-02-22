import { createHash, randomUUID } from "node:crypto";

/**
 * Generate a deterministic record ID from payment attributes.
 * SHA-256 of concatenated inputs, truncated to 16 hex chars.
 */
export function generateRecordId(
  agentId: string,
  endpoint: string,
  timestamp: number,
  amount: string,
): string {
  const input = `${agentId}|${endpoint}|${timestamp}|${amount}`;
  const hash = createHash("sha256").update(input).digest("hex");
  return hash.slice(0, 16);
}

/** Generate a random session ID (UUID v4) */
export function generateSessionId(): string {
  return randomUUID();
}
