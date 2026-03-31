import { db } from "@/db/client";
import { payments, agents, budgetPolicies, alerts } from "@/db/schema";
import { eq, desc, sql, gte, and } from "drizzle-orm";

export async function gatherChatContext(teamId: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    summaryStats,
    recentPayments,
    agentsWithSpend,
    activePolicies,
    recentAlerts,
    spendByEndpoint,
    dailySpend,
    topAgentsThisWeek,
    failedPayments,
  ] = await Promise.all([
    // 1. Summary stats
    db
      .select({
        totalSpend: sql<number>`COALESCE(SUM(${payments.amountUsd}), 0)`,
        paymentCount: sql<number>`COUNT(*)`,
        uniqueAgents: sql<number>`COUNT(DISTINCT ${payments.agentId})`,
        uniqueEndpoints: sql<number>`COUNT(DISTINCT ${payments.endpointDomain})`,
      })
      .from(payments)
      .where(eq(payments.teamId, teamId)),

    // 2. Recent 100 payments with agent externalId
    db
      .select({
        id: payments.id,
        agentExternalId: agents.externalId,
        url: payments.url,
        endpointDomain: payments.endpointDomain,
        amountUsd: payments.amountUsd,
        status: payments.status,
        network: payments.network,
        txHash: payments.txHash,
        timestamp: payments.timestamp,
        createdAt: payments.createdAt,
      })
      .from(payments)
      .leftJoin(agents, eq(payments.agentId, agents.id))
      .where(eq(payments.teamId, teamId))
      .orderBy(desc(payments.createdAt))
      .limit(100),

    // 3. Agent spend aggregation
    db
      .select({
        agentId: payments.agentId,
        agentExternalId: agents.externalId,
        agentName: agents.name,
        totalSpend: sql<number>`SUM(${payments.amountUsd})`,
        paymentCount: sql<number>`COUNT(*)`,
        lastActive: sql<string>`MAX(${payments.createdAt})`,
      })
      .from(payments)
      .leftJoin(agents, eq(payments.agentId, agents.id))
      .where(eq(payments.teamId, teamId))
      .groupBy(payments.agentId),

    // 4. Active budget policies
    db
      .select()
      .from(budgetPolicies)
      .where(
        and(eq(budgetPolicies.teamId, teamId), eq(budgetPolicies.isActive, true))
      ),

    // 5. Recent 50 alerts
    db
      .select()
      .from(alerts)
      .where(eq(alerts.teamId, teamId))
      .orderBy(desc(alerts.createdAt))
      .limit(50),

    // 6. Spend by endpoint domain (top 20)
    db
      .select({
        endpointDomain: payments.endpointDomain,
        totalSpend: sql<number>`SUM(${payments.amountUsd})`,
        callCount: sql<number>`COUNT(*)`,
      })
      .from(payments)
      .where(eq(payments.teamId, teamId))
      .groupBy(payments.endpointDomain)
      .orderBy(desc(sql`SUM(${payments.amountUsd})`))
      .limit(20),

    // 7. Daily spend for last 30 days
    db
      .select({
        date: sql<string>`DATE(${payments.timestamp})`,
        totalSpend: sql<number>`SUM(${payments.amountUsd})`,
        paymentCount: sql<number>`COUNT(*)`,
      })
      .from(payments)
      .where(and(eq(payments.teamId, teamId), gte(payments.createdAt, monthAgo)))
      .groupBy(sql`DATE(${payments.timestamp})`)
      .orderBy(sql`DATE(${payments.timestamp})`),

    // 8. Top agents by spend this week
    db
      .select({
        agentId: payments.agentId,
        agentExternalId: agents.externalId,
        weeklySpend: sql<number>`SUM(${payments.amountUsd})`,
      })
      .from(payments)
      .leftJoin(agents, eq(payments.agentId, agents.id))
      .where(and(eq(payments.teamId, teamId), gte(payments.createdAt, weekAgo)))
      .groupBy(payments.agentId)
      .orderBy(desc(sql`SUM(${payments.amountUsd})`))
      .limit(10),

    // 9. Failed payments (last 50)
    db
      .select({
        id: payments.id,
        agentExternalId: agents.externalId,
        url: payments.url,
        amountUsd: payments.amountUsd,
        status: payments.status,
        timestamp: payments.timestamp,
      })
      .from(payments)
      .leftJoin(agents, eq(payments.agentId, agents.id))
      .where(and(eq(payments.teamId, teamId), eq(payments.status, "failed")))
      .orderBy(desc(payments.createdAt))
      .limit(50),
  ]);

  const todayPayments = recentPayments.filter(
    (p) => p.createdAt && new Date(p.createdAt) >= today
  );
  const todaySpend = todayPayments.reduce(
    (sum, p) => sum + (p.amountUsd || 0),
    0
  );

  const weekPayments = recentPayments.filter(
    (p) => p.createdAt && new Date(p.createdAt) >= weekAgo
  );
  const weekSpend = weekPayments.reduce(
    (sum, p) => sum + (p.amountUsd || 0),
    0
  );

  const dailyAvg =
    dailySpend.length > 0
      ? dailySpend.reduce((sum, d) => sum + d.totalSpend, 0) / dailySpend.length
      : 0;

  return {
    summary: {
      totalSpendAllTime: summaryStats[0]?.totalSpend ?? 0,
      totalSpendToday: todaySpend,
      totalSpendThisWeek: weekSpend,
      totalPayments: summaryStats[0]?.paymentCount ?? 0,
      uniqueAgents: summaryStats[0]?.uniqueAgents ?? 0,
      uniqueEndpoints: summaryStats[0]?.uniqueEndpoints ?? 0,
      dailyAverage: dailyAvg,
    },
    recentPayments: recentPayments.map((p) => ({
      id: p.id,
      agent: p.agentExternalId || "unknown",
      url: p.url,
      domain: p.endpointDomain,
      amountUsd: p.amountUsd,
      status: p.status,
      network: p.network,
      txHash: p.txHash,
      timestamp: p.timestamp,
    })),
    agents: agentsWithSpend.map((a) => ({
      agent: a.agentExternalId || a.agentId,
      name: a.agentName,
      totalSpend: a.totalSpend,
      paymentCount: a.paymentCount,
      lastActive: a.lastActive,
    })),
    policies: activePolicies.map((p) => ({
      id: p.id,
      name: p.name,
      agentExternalId: p.agentExternalId,
      policy: p.policy,
      isActive: p.isActive,
    })),
    alerts: recentAlerts.map((a) => ({
      id: a.id,
      type: a.type,
      severity: a.severity,
      message: a.message,
      resolved: a.resolved,
      createdAt: a.createdAt,
    })),
    spendByEndpoint,
    dailySpend,
    topAgentsThisWeek: topAgentsThisWeek.map((a) => ({
      agent: a.agentExternalId || a.agentId,
      weeklySpend: a.weeklySpend,
    })),
    failedPayments: failedPayments.map((p) => ({
      id: p.id,
      agent: p.agentExternalId || "unknown",
      url: p.url,
      amountUsd: p.amountUsd,
      timestamp: p.timestamp,
    })),
    metadata: {
      dataAsOf: now.toISOString(),
      timezone: "UTC",
    },
  };
}
