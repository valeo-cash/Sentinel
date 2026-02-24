import { createHmac, createHash } from "crypto";
import { nanoid } from "nanoid";

export interface ReceiptParams {
  teamId: string;
  paymentId?: string | null;
  agentId: string;
  endpoint: string;
  method: string;
  amount: string;
  currency?: string | null;
  network: string;
  txHash?: string | null;
  requestBody?: string | object | null;
  responseBody?: string | Buffer | null;
  responseStatus?: number | null;
}

export interface ReceiptRow {
  id: string;
  teamId: string;
  paymentId: string | null;
  agentId: string;
  endpoint: string;
  method: string;
  amount: string;
  currency: string;
  network: string;
  txHash: string | null;
  requestHash: string;
  responseHash: string;
  responseStatus: number | null;
  responseSize: number | null;
  sentinelSignature: string;
  verified: boolean;
  expiresAt: Date | null;
  createdAt: Date;
}

export function generateReceipt(params: ReceiptParams): ReceiptRow {
  const id = `sr_${nanoid(16)}`;
  const now = new Date();

  const reqBodyStr =
    params.requestBody && typeof params.requestBody === "object"
      ? JSON.stringify(params.requestBody)
      : (params.requestBody as string) || "";
  const requestHash = createHash("sha256").update(reqBodyStr).digest("hex");

  const responseStr =
    typeof params.responseBody === "string"
      ? params.responseBody
      : params.responseBody
        ? Buffer.from(params.responseBody).toString()
        : "";
  const responseHash = createHash("sha256").update(responseStr).digest("hex");
  const responseSize = Buffer.byteLength(responseStr);

  const payload = {
    id,
    teamId: params.teamId,
    paymentId: params.paymentId || null,
    agentId: params.agentId,
    endpoint: params.endpoint,
    method: params.method,
    amount: params.amount,
    currency: params.currency || "USDC",
    network: params.network,
    txHash: params.txHash || null,
    requestHash,
    responseHash,
    responseStatus: params.responseStatus || null,
    responseSize,
    createdAt: now.getTime(),
  };

  const secret = process.env.SENTINEL_RECEIPT_SECRET || "dev-secret-change-me";
  const sentinelSignature = createHmac("sha256", secret)
    .update(JSON.stringify(payload))
    .digest("hex");

  return {
    ...payload,
    sentinelSignature,
    verified: true,
    expiresAt: null,
    createdAt: now,
  };
}

export function verifyReceiptSignature(receipt: {
  id: string;
  teamId: string;
  paymentId: string | null;
  agentId: string;
  endpoint: string;
  method: string;
  amount: string;
  currency: string;
  network: string;
  txHash: string | null;
  requestHash: string;
  responseHash: string;
  responseStatus: number | null;
  responseSize: number | null;
  sentinelSignature: string;
  createdAt: Date | number;
}): boolean {
  const payload = {
    id: receipt.id,
    teamId: receipt.teamId,
    paymentId: receipt.paymentId,
    agentId: receipt.agentId,
    endpoint: receipt.endpoint,
    method: receipt.method,
    amount: receipt.amount,
    currency: receipt.currency,
    network: receipt.network,
    txHash: receipt.txHash,
    requestHash: receipt.requestHash,
    responseHash: receipt.responseHash,
    responseStatus: receipt.responseStatus,
    responseSize: receipt.responseSize,
    createdAt:
      receipt.createdAt instanceof Date
        ? receipt.createdAt.getTime()
        : receipt.createdAt,
  };

  const secret = process.env.SENTINEL_RECEIPT_SECRET || "dev-secret-change-me";
  const expected = createHmac("sha256", secret)
    .update(JSON.stringify(payload))
    .digest("hex");

  return expected === receipt.sentinelSignature;
}
