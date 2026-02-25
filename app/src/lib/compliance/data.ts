import { db } from "@/db/client";
import { payments, agents, budgetPolicies, alerts, receipts } from "@/db/schema";
import { eq, and, gte, lte, desc, count } from "drizzle-orm";
import {
  getSummary,
  getByAgent,
  getByNetwork,
  getByEndpoint,
  getTimeseries,
} from "@/server/analytics";
import { assessRisk } from "./risk";
import type { ComplianceData, PaymentRow, PolicyRow, AlertRow, ReceiptRow } from "./types";

export async function fetchComplianceData(
  teamId: string,
  teamName: string,
  startDate: string,
  endDate: string
): Promise<ComplianceData> {
  const range = { from: startDate, to: endDate };

  const [summary, timeseries, byAgent, byNetwork, byEndpoint, paymentRows, policyRows, alertRows, receiptRows] =
    await Promise.all([
      getSummary(teamId, range),
      getTimeseries(teamId, "day", range),
      getByAgent(teamId, range),
      getByNetwork(teamId, range),
      getByEndpoint(teamId, range),
      fetchPayments(teamId, startDate, endDate),
      fetchPolicies(teamId),
      fetchAlerts(teamId, startDate, endDate),
      fetchReceipts(teamId, startDate, endDate),
    ]);

  const base = {
    teamName,
    startDate,
    endDate,
    generatedAt: new Date().toISOString(),
    summary,
    timeseries,
    byAgent,
    byNetwork,
    byEndpoint,
    payments: paymentRows,
    policies: policyRows,
    alerts: alertRows,
    receipts: receiptRows,
  };

  const risk = assessRisk({ ...base, risk: { level: "Low", findings: [], recommendations: [] } });

  return { ...base, risk };
}

async function fetchPayments(
  teamId: string,
  startDate: string,
  endDate: string
): Promise<PaymentRow[]> {
  const rows = await db
    .select({
      id: payments.id,
      agentId: payments.agentId,
      agentExternalId: agents.externalId,
      endpoint: payments.endpointDomain,
      amount: payments.amount,
      amountUsd: payments.amountUsd,
      asset: payments.asset,
      network: payments.network,
      txHash: payments.txHash,
      status: payments.status,
      timestamp: payments.timestamp,
    })
    .from(payments)
    .innerJoin(agents, eq(payments.agentId, agents.id))
    .where(
      and(
        eq(payments.teamId, teamId),
        gte(payments.timestamp, startDate),
        lte(payments.timestamp, endDate)
      )
    )
    .orderBy(desc(payments.createdAt))
    .limit(5000);

  return rows;
}

async function fetchPolicies(teamId: string): Promise<PolicyRow[]> {
  const rows = await db
    .select({
      id: budgetPolicies.id,
      name: budgetPolicies.name,
      agentExternalId: budgetPolicies.agentExternalId,
      policy: budgetPolicies.policy,
      isActive: budgetPolicies.isActive,
    })
    .from(budgetPolicies)
    .where(eq(budgetPolicies.teamId, teamId));

  return rows.map((r) => ({
    ...r,
    isActive: !!r.isActive,
  }));
}

async function fetchAlerts(
  teamId: string,
  startDate: string,
  endDate: string
): Promise<AlertRow[]> {
  const rows = await db
    .select({
      id: alerts.id,
      agentId: alerts.agentId,
      type: alerts.type,
      severity: alerts.severity,
      message: alerts.message,
      resolved: alerts.resolved,
      createdAt: alerts.createdAt,
    })
    .from(alerts)
    .where(
      and(
        eq(alerts.teamId, teamId),
        gte(alerts.createdAt, new Date(startDate)),
        lte(alerts.createdAt, new Date(endDate))
      )
    )
    .orderBy(desc(alerts.createdAt));

  return rows.map((r) => ({
    ...r,
    resolved: !!r.resolved,
  }));
}

async function fetchReceipts(
  teamId: string,
  startDate: string,
  endDate: string
): Promise<ReceiptRow[]> {
  const rows = await db
    .select({
      id: receipts.id,
      agentId: receipts.agentId,
      paymentId: receipts.paymentId,
      verified: receipts.verified,
      createdAt: receipts.createdAt,
    })
    .from(receipts)
    .where(
      and(
        eq(receipts.teamId, teamId),
        gte(receipts.createdAt, new Date(startDate)),
        lte(receipts.createdAt, new Date(endDate))
      )
    )
    .orderBy(desc(receipts.createdAt));

  return rows.map((r) => ({
    ...r,
    verified: !!r.verified,
  }));
}
