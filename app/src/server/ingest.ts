import { db } from "@/db/client";
import { agents, payments, receipts } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { generateAlerts } from "./alerts";
import { generateReceipt } from "@/lib/receipts/generate";
import type { ValidatedEvent } from "./validation";

const USDC_DECIMALS = 1_000_000;

/**
 * Upserts an agent: finds by (teamId, externalId), creates if not exists with nanoid, updates lastSeenAt.
 * Returns the agent's internal id.
 */
async function upsertAgent(
  teamId: string,
  externalId: string
): Promise<string> {
  const now = new Date();
  const [existing] = await db
    .select()
    .from(agents)
    .where(and(eq(agents.teamId, teamId), eq(agents.externalId, externalId)))
    .limit(1);

  if (existing) {
    await db
      .update(agents)
      .set({ lastSeenAt: now })
      .where(eq(agents.id, existing.id));
    return existing.id;
  }

  const id = nanoid();
  await db.insert(agents).values({
    id,
    teamId,
    externalId,
    firstSeenAt: now,
    lastSeenAt: now,
  });
  return id;
}

/**
 * Extracts hostname from endpoint URL. Returns "unknown" if URL is invalid.
 */
function extractEndpointDomain(endpoint: string): string {
  try {
    return new URL(endpoint).hostname;
  } catch {
    return "unknown";
  }
}

/**
 * Converts amount_raw (base units) to USD float. USDC uses 6 decimals.
 */
function amountRawToUsd(amountRaw: string): number {
  return parseInt(amountRaw || "0", 10) / USDC_DECIMALS;
}

/**
 * Maps event fields to payment status.
 */
function mapStatus(event: ValidatedEvent): string {
  if (event.policy_evaluation === "blocked") return "blocked";
  if (event.tx_hash) return "paid";
  if (event.status_code >= 400) return "failed";
  return "unpaid";
}

/**
 * Processes a batch of validated events for a team.
 * Upserts agents, inserts payments, generates alerts.
 */
export async function processEvents(
  teamId: string,
  events: ValidatedEvent[]
): Promise<{
  ingested: number;
  errors: Array<{ index: number; message: string }>;
  alerts_created: number;
}> {
  const errors: Array<{ index: number; message: string }> = [];
  let alertsCreated = 0;

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    if (!event) continue;
    try {
      const agentId = await upsertAgent(teamId, event.agent_id);
      const endpointDomain = extractEndpointDomain(event.endpoint);
      const amountUsd = amountRawToUsd(event.amount_raw);
      const status = mapStatus(event);

      const paymentId = nanoid();
      const now = new Date();
      const timestamp = now.toISOString();

      await db.insert(payments).values({
        id: paymentId,
        teamId,
        agentId,
        url: event.endpoint,
        method: event.method,
        endpointDomain,
        status,
        amount: event.amount,
        amountUsd,
        asset: event.asset || null,
        network: event.network || null,
        txHash: event.tx_hash || null,
        scheme: event.scheme || null,
        payTo: event.payee_address || null,
        taskId: event.task_id || null,
        tags: event.tags?.length ? event.tags : null,
        budgetEvaluation: event.policy_evaluation,
        responseTimeMs: event.response_time_ms ?? null,
        timestamp,
        createdAt: now,
      });

      const count = await generateAlerts(
        {
          id: paymentId,
          status,
          amountUsd,
          budgetEvaluation: event.policy_evaluation,
        },
        teamId,
        agentId
      );
      alertsCreated += count;

      // Generate receipt (fire-and-forget)
      if (status === "paid") {
        const receipt = generateReceipt({
          teamId,
          paymentId,
          agentId: event.agent_id,
          endpoint: event.endpoint,
          method: event.method,
          amount: event.amount,
          currency: event.asset || "USDC",
          network: event.network || "unknown",
          txHash: event.tx_hash,
          requestBody: JSON.stringify({ endpoint: event.endpoint, method: event.method }),
          responseBody: JSON.stringify(event.metadata ?? {}),
          responseStatus: event.status_code,
        });
        db.insert(receipts).values(receipt).catch((err) =>
          console.error("[ingest] Receipt generation failed:", err)
        );
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown error during ingest";
      errors.push({ index: i, message });
    }
  }

  return {
    ingested: events.length - errors.length,
    errors,
    alerts_created: alertsCreated,
  };
}
