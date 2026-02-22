import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { authenticateRequest } from "@/server/auth";
import { db } from "@/db/client";
import { agents, payments } from "@/db/schema";
import { and, eq, gte, sql } from "drizzle-orm";

const PROXY_TIMEOUT_MS = 30_000;
const USDC_DECIMALS = 1_000_000;

const BUDGET_PRESETS: Record<string, { perCall: number; perHour: number; perDay: number }> = {
  conservative: { perCall: 0.10, perHour: 5.00, perDay: 50.00 },
  standard: { perCall: 1.00, perHour: 25.00, perDay: 200.00 },
  liberal: { perCall: 10.00, perHour: 100.00, perDay: 1000.00 },
};

const executeSchema = z.object({
  endpoint: z.string().url(),
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
  headers: z.record(z.string()).optional().default({}),
  body: z.string().nullable().optional(),
  agentId: z.string().min(1),
  budget: z.string().default("standard"),
  network: z.string().default("eip155:84532"),
  customBudget: z
    .object({
      perCall: z.number().positive(),
      perHour: z.number().positive(),
      perDay: z.number().positive(),
    })
    .optional(),
});

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

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = executeSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { endpoint, method, headers: userHeaders, body, agentId, budget, network, customBudget } = parsed.data;
  const teamId = auth.team.id;

  const agentInternalId = await upsertAgent(teamId, agentId);

  const budgetLimits = customBudget ?? BUDGET_PRESETS[budget] ?? BUDGET_PRESETS.standard!;
  const hourlySpend = await getHourlySpend(teamId, agentInternalId);

  if (hourlySpend >= budgetLimits.perHour) {
    return NextResponse.json({
      error: "budget_exceeded",
      budgetCheck: {
        passed: false,
        hourlyLimit: budgetLimits.perHour,
        hourlySpent: hourlySpend,
        perCallLimit: budgetLimits.perCall,
      },
    }, { status: 403 });
  }

  const isEchoEndpoint = endpoint.includes("/api/v1/playground/echo");

  const forwardHeaders = new Headers();
  for (const [key, value] of Object.entries(userHeaders)) {
    forwardHeaders.set(key, value);
  }
  if (isEchoEndpoint) {
    forwardHeaders.set("x-playground-network", network);
    const sessionCookie = request.cookies.get("sentinel_session")?.value;
    if (sessionCookie) {
      forwardHeaders.set("cookie", `sentinel_session=${sessionCookie}`);
    }
  }

  let targetUrl = endpoint;
  if (isEchoEndpoint && !endpoint.startsWith("http")) {
    const origin = request.headers.get("origin") || request.nextUrl.origin;
    targetUrl = `${origin}${endpoint}`;
  }

  const startTime = Date.now();
  let response: Response;
  try {
    const hasBody = method !== "GET";
    response = await fetch(targetUrl, {
      method,
      headers: forwardHeaders,
      body: hasBody && body ? body : undefined,
      signal: AbortSignal.timeout(PROXY_TIMEOUT_MS),
    });
  } catch (err) {
    const elapsed = Date.now() - startTime;
    const isTimeout = err instanceof DOMException && err.name === "TimeoutError";
    return NextResponse.json({
      status: isTimeout ? 504 : 502,
      error: isTimeout ? "gateway_timeout" : "bad_gateway",
      message: `Failed to reach endpoint`,
      responseTimeMs: elapsed,
      headers: {},
      body: null,
    });
  }

  const elapsed = Date.now() - startTime;

  const responseHeaders: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });

  let responseBody: string | null = null;
  try {
    responseBody = await response.text();
  } catch {
    responseBody = null;
  }

  const paymentHeaderRaw =
    response.headers.get("x-payment") ||
    response.headers.get("payment");
  const paymentResponseRaw =
    response.headers.get("payment-response") ||
    response.headers.get("x-payment-response");

  let paymentRequired = null;
  if (response.status === 402 && paymentHeaderRaw) {
    paymentRequired = parsePAYMENT_RESPONSE(paymentHeaderRaw);
  }

  let paymentDetails = null;
  if (paymentResponseRaw) {
    const pr = parsePAYMENT_RESPONSE(paymentResponseRaw);
    if (pr) {
      const amount = pr.amount || pr.value || "0";
      const amountUsd = parseInt(amount || "0", 10) / USDC_DECIMALS;

      const recordId = `pay_${nanoid()}`;
      const now = new Date();
      let endpointDomain = "unknown";
      try {
        endpointDomain = new URL(endpoint).hostname;
      } catch {}

      await db.insert(payments).values({
        id: recordId,
        teamId,
        agentId: agentInternalId,
        url: endpoint,
        method,
        endpointDomain,
        status: pr.success === false ? "failed" : "paid",
        amount,
        amountUsd,
        asset: pr.asset || "USDC",
        network: pr.network || network,
        txHash: pr.txHash || null,
        scheme: pr.scheme || "exact",
        payTo: pr.payTo || null,
        category: "playground",
        description: `Playground request to ${endpointDomain}`,
        tags: ["playground"],
        responseTimeMs: elapsed,
        timestamp: now.toISOString(),
        createdAt: now,
      });

      const updatedHourlySpend = await getHourlySpend(teamId, agentInternalId);

      paymentDetails = {
        recordId,
        txHash: pr.txHash || null,
        amount,
        amountUsd,
        network: pr.network || network,
        asset: pr.asset || "USDC",
        status: pr.success === false ? "failed" : "paid",
        budgetRemaining: {
          hourly: Math.max(0, budgetLimits.perHour - updatedHourlySpend),
          hourlyLimit: budgetLimits.perHour,
          hourlySpent: updatedHourlySpend,
        },
      };
    }
  }

  return NextResponse.json({
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
    body: responseBody,
    responseTimeMs: elapsed,
    paymentRequired,
    paymentDetails,
    budgetCheck: {
      passed: true,
      hourlyLimit: budgetLimits.perHour,
      hourlySpent: hourlySpend,
      perCallLimit: budgetLimits.perCall,
    },
  });
}
