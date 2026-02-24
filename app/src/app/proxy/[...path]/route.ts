import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { nanoid } from "nanoid";
import { db } from "@/db/client";
import { teams, agents, payments, apiKeys, receipts } from "@/db/schema";
import { and, eq, gte, sql } from "drizzle-orm";
import { generateReceipt } from "@/lib/receipts/generate";

const USDC_DECIMALS = 1_000_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 100;
const PROXY_TIMEOUT_MS = 30_000;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(teamId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(teamId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(teamId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}

function extractTarget(pathSegments: string[]) {
  const host = pathSegments[0]!;
  const targetPath = pathSegments.slice(1).join("/");
  return { host, path: targetPath, url: `https://${host}/${targetPath}` };
}

async function authenticateProxy(req: NextRequest) {
  const key =
    req.headers.get("x-sentinel-key") ||
    req.headers.get("X-Sentinel-Key") ||
    req.nextUrl.searchParams.get("sentinel_key");

  console.log("PROXY DEBUG - X-Sentinel-Key:", req.headers.get("x-sentinel-key"));
  console.log("PROXY DEBUG - sentinel_key param:", req.nextUrl.searchParams.get("sentinel_key"));
  console.log("PROXY DEBUG - resolved key:", key ? `${key.slice(0, 8)}...` : "null");

  if (!key) return null;

  const hash = createHash("sha256").update(key).digest("hex");

  const [apiKeyRow] = await db
    .select({ teamId: apiKeys.teamId })
    .from(apiKeys)
    .where(eq(apiKeys.keyHash, hash))
    .limit(1);

  if (apiKeyRow) {
    await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.keyHash, hash));
    const [team] = await db
      .select({ id: teams.id, name: teams.name, plan: teams.plan })
      .from(teams)
      .where(eq(teams.id, apiKeyRow.teamId))
      .limit(1);
    if (team) return team;
  }

  const [team] = await db
    .select({ id: teams.id, name: teams.name, plan: teams.plan })
    .from(teams)
    .where(eq(teams.apiKeyHash, hash))
    .limit(1);
  return team ?? null;
}

async function upsertAgent(teamId: string, externalId: string): Promise<string> {
  const now = new Date();
  const [existing] = await db
    .select()
    .from(agents)
    .where(and(eq(agents.teamId, teamId), eq(agents.externalId, externalId)))
    .limit(1);

  if (existing) {
    await db.update(agents).set({ lastSeenAt: now }).where(eq(agents.id, existing.id));
    return existing.id;
  }

  const id = `agent_${nanoid()}`;
  await db.insert(agents).values({
    id,
    teamId,
    externalId,
    name: externalId,
    firstSeenAt: now,
    lastSeenAt: now,
  });
  return id;
}

async function getHourlySpend(teamId: string, agentInternalId: string) {
  const oneHourAgo = new Date(Date.now() - 3_600_000);
  const [row] = await db
    .select({ total: sql<number>`coalesce(sum(${payments.amountUsd}), 0)` })
    .from(payments)
    .where(
      and(
        eq(payments.teamId, teamId),
        eq(payments.agentId, agentInternalId),
        gte(payments.createdAt, oneHourAgo)
      )
    );
  return row?.total ?? 0;
}

async function logProxyPayment(
  teamId: string,
  agentInternalId: string,
  data: {
    url: string;
    method: string;
    status: string;
    amount: string;
    amountUsd: number;
    txHash: string | null;
    network: string | null;
    asset: string | null;
    scheme: string | null;
    payTo: string | null;
    responseTimeMs: number;
    endpointDomain: string;
    category: string | null;
  }
): Promise<string> {
  const id = `pay_${nanoid()}`;
  const now = new Date();

  await db.insert(payments).values({
    id,
    teamId,
    agentId: agentInternalId,
    url: data.url,
    method: data.method,
    endpointDomain: data.endpointDomain,
    status: data.status,
    amount: data.amount,
    amountUsd: data.amountUsd,
    asset: data.asset,
    network: data.network,
    txHash: data.txHash,
    scheme: data.scheme,
    payTo: data.payTo,
    category: data.category || "proxy",
    description: `Proxy request to ${data.endpointDomain}`,
    tags: ["proxy"],
    responseTimeMs: data.responseTimeMs,
    timestamp: now.toISOString(),
    createdAt: now,
  });
  return id;
}

function parsePAYMENT_RESPONSE(raw: string | null) {
  if (!raw) return null;
  try {
    const decoded = Buffer.from(raw, "base64").toString("utf-8");
    return JSON.parse(decoded);
  } catch {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS",
  "Access-Control-Allow-Headers":
    "X-Sentinel-Key, X-Sentinel-Agent, Content-Type, Authorization, Payment, X-Payment",
};

async function handleProxy(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const startTime = Date.now();
  const { path: pathSegments } = await params;

  if (!pathSegments || pathSegments.length === 0) {
    return NextResponse.json(
      { error: "missing_target", message: "No target URL provided. Use /proxy/{host}/{path}" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const team = await authenticateProxy(req);
  if (!team) {
    return NextResponse.json(
      { error: "unauthorized", message: "Valid X-Sentinel-Key header or sentinel_key query param required" },
      { status: 401, headers: CORS_HEADERS }
    );
  }

  if (!checkRateLimit(team.id)) {
    return NextResponse.json(
      { error: "rate_limited", message: "Max 100 requests per minute exceeded" },
      { status: 429, headers: { ...CORS_HEADERS, "Retry-After": "60" } }
    );
  }

  const target = extractTarget(pathSegments);
  const agentExternalId =
    req.headers.get("x-sentinel-agent") ||
    req.nextUrl.searchParams.get("agent_id") ||
    "proxy-default";

  const agentInternalId = await upsertAgent(team.id, agentExternalId);

  const forwardHeaders = new Headers();
  req.headers.forEach((value, key) => {
    const skip = new Set([
      "host",
      "x-sentinel-key",
      "x-sentinel-agent",
      "connection",
      "transfer-encoding",
    ]);
    if (!skip.has(key.toLowerCase())) {
      forwardHeaders.set(key, value);
    }
  });
  forwardHeaders.set("host", target.host);

  const targetUrl = new URL(target.url);
  req.nextUrl.searchParams.forEach((value, key) => {
    if (key !== "sentinel_key" && key !== "agent_id") {
      targetUrl.searchParams.set(key, value);
    }
  });

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const reqBody = hasBody ? await req.arrayBuffer() : undefined;

  let response: Response;
  try {

    response = await fetch(targetUrl.toString(), {
      method: req.method,
      headers: forwardHeaders,
      body: reqBody ? Buffer.from(reqBody) : undefined,
      signal: AbortSignal.timeout(PROXY_TIMEOUT_MS),
    });
  } catch (err) {
    const elapsed = Date.now() - startTime;
    const isTimeout = err instanceof DOMException && err.name === "TimeoutError";
    const statusCode = isTimeout ? 504 : 502;
    const errorType = isTimeout ? "gateway_timeout" : "bad_gateway";

    await logProxyPayment(team.id, agentInternalId, {
      url: target.url,
      method: req.method,
      status: "failed",
      amount: "0",
      amountUsd: 0,
      txHash: null,
      network: null,
      asset: null,
      scheme: null,
      payTo: null,
      responseTimeMs: elapsed,
      endpointDomain: target.host,
      category: "proxy",
    });

    return NextResponse.json(
      { error: errorType, message: `Failed to reach ${target.host}` },
      { status: statusCode, headers: CORS_HEADERS }
    );
  }

  const elapsed = Date.now() - startTime;

  const paymentResponseRaw =
    response.headers.get("payment-response") ||
    response.headers.get("x-payment-response");
  const parsed = parsePAYMENT_RESPONSE(paymentResponseRaw);

  let amount = "0";
  let amountUsd = 0;
  let txHash: string | null = null;
  let network: string | null = null;
  let asset: string | null = null;
  let scheme: string | null = null;
  let payTo: string | null = null;
  let paymentStatus: string;

  if (parsed) {
    amount = parsed.amount || parsed.value || "0";
    amountUsd = parseInt(amount || "0", 10) / USDC_DECIMALS;
    txHash = parsed.txHash || parsed.transactionHash || null;
    network = parsed.network || parsed.networkId || parsed.chainId || null;
    asset = parsed.asset || "USDC";
    scheme = parsed.scheme || "x402";
    payTo = parsed.payTo || parsed.payee || null;
    paymentStatus = parsed.success === false ? "failed" : "paid";
  } else if (response.status === 402) {
    paymentStatus = "unpaid";
  } else if (response.status >= 400) {
    paymentStatus = "failed";
  } else {
    paymentStatus = paymentResponseRaw ? "paid" : "unpaid";
  }

  const recordId = await logProxyPayment(team.id, agentInternalId, {
    url: target.url,
    method: req.method,
    status: paymentStatus,
    amount,
    amountUsd,
    txHash,
    network,
    asset,
    scheme,
    payTo,
    responseTimeMs: elapsed,
    endpointDomain: target.host,
    category: "proxy",
  });

  const hourlySpend = await getHourlySpend(team.id, agentInternalId);

  const responseBody = await response.arrayBuffer();

  // Generate receipt asynchronously (fire-and-forget)
  let receiptId: string | null = null;
  if (paymentStatus === "paid") {
    try {
      const receipt = generateReceipt({
        teamId: team.id,
        paymentId: recordId,
        agentId: agentExternalId,
        endpoint: target.url,
        method: req.method,
        amount,
        currency: asset || "USDC",
        network: network || "unknown",
        txHash,
        requestBody: reqBody ? Buffer.from(reqBody).toString() : "",
        responseBody: Buffer.from(responseBody),
        responseStatus: response.status,
      });
      await db.insert(receipts).values(receipt);
      receiptId = receipt.id;
    } catch (err) {
      console.error("[proxy] Receipt generation failed:", err);
    }
  }

  const responseHeaders = new Headers();
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "transfer-encoding") {
      responseHeaders.set(key, value);
    }
  });

  responseHeaders.set("x-sentinel-record", recordId);
  if (receiptId) responseHeaders.set("x-sentinel-receipt", receiptId);
  responseHeaders.set("x-sentinel-agent", agentExternalId);
  responseHeaders.set("x-sentinel-budget-spent", `$${hourlySpend.toFixed(2)}/hr`);
  Object.entries(CORS_HEADERS).forEach(([k, v]) => responseHeaders.set(k, v));

  return new NextResponse(responseBody, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const DELETE = handleProxy;
export const PATCH = handleProxy;
export const HEAD = handleProxy;
