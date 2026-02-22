import { db } from "@/db/client";
import { alerts } from "@/db/schema";
import { nanoid } from "nanoid";

export type PaymentForAlerts = {
  id: string;
  status: string;
  amountUsd: number | null;
  budgetEvaluation: string | null;
};

/**
 * Generates alerts based on payment characteristics.
 * - blocked payment → budget_exceeded, critical
 * - policy_evaluation === "flagged" → price_spike, warning
 * - amountUsd > 1.00 → anomaly, info (large payment)
 * - status === "failed" → anomaly, warning
 */
export async function generateAlerts(
  payment: PaymentForAlerts,
  teamId: string,
  agentId: string
): Promise<number> {
  const newAlerts: Array<{
    id: string;
    teamId: string;
    agentId: string;
    paymentId: string;
    type: string;
    severity: string;
    message: string;
    metadata: Record<string, unknown> | null;
    resolved: boolean;
    createdAt: Date;
  }> = [];

  const now = new Date();

  // blocked payment → budget_exceeded, critical
  if (payment.status === "blocked") {
    newAlerts.push({
      id: nanoid(),
      teamId,
      agentId,
      paymentId: payment.id,
      type: "budget_exceeded",
      severity: "critical",
      message: "Payment was blocked due to budget policy",
      metadata: { paymentId: payment.id },
      resolved: false,
      createdAt: now,
    });
  }

  // policy_evaluation === "flagged" → price_spike, warning
  if (payment.budgetEvaluation === "flagged") {
    newAlerts.push({
      id: nanoid(),
      teamId,
      agentId,
      paymentId: payment.id,
      type: "price_spike",
      severity: "warning",
      message: "Payment was flagged by policy evaluation",
      metadata: { paymentId: payment.id },
      resolved: false,
      createdAt: now,
    });
  }

  // amountUsd > 1.00 → anomaly, info (large payment)
  if (payment.amountUsd !== null && payment.amountUsd > 1.0) {
    newAlerts.push({
      id: nanoid(),
      teamId,
      agentId,
      paymentId: payment.id,
      type: "anomaly",
      severity: "info",
      message: `Large payment detected: $${payment.amountUsd.toFixed(2)} USD`,
      metadata: { paymentId: payment.id, amountUsd: payment.amountUsd },
      resolved: false,
      createdAt: now,
    });
  }

  // status === "failed" → anomaly, warning
  if (payment.status === "failed") {
    newAlerts.push({
      id: nanoid(),
      teamId,
      agentId,
      paymentId: payment.id,
      type: "anomaly",
      severity: "warning",
      message: "Payment failed",
      metadata: { paymentId: payment.id },
      resolved: false,
      createdAt: now,
    });
  }

  if (newAlerts.length === 0) {
    return 0;
  }

  await db.insert(alerts).values(
    newAlerts.map((a) => ({
      id: a.id,
      teamId: a.teamId,
      agentId: a.agentId,
      paymentId: a.paymentId,
      type: a.type,
      severity: a.severity,
      message: a.message,
      metadata: a.metadata,
      resolved: a.resolved,
      createdAt: a.createdAt,
    }))
  );

  return newAlerts.length;
}
