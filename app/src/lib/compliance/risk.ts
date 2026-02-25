import type { ComplianceData, RiskAssessment } from "./types";

export function assessRisk(data: ComplianceData): RiskAssessment {
  const findings: string[] = [];
  const recommendations: string[] = [];
  let score = 0;

  const { summary, byAgent, policies, alerts, receipts, payments } = data;

  // Spend concentration
  if (byAgent.length > 0 && summary.total_spent_usd > 0) {
    const topAgent = byAgent[0]!;
    const topPct = (topAgent.total_usd / summary.total_spent_usd) * 100;
    if (topPct > 80) {
      findings.push(
        `High spend concentration: agent "${topAgent.agent_id}" accounts for ${topPct.toFixed(0)}% of total spend`
      );
      recommendations.push(
        `Review spending distribution — consider adding budget limits for "${topAgent.agent_id}"`
      );
      score += 2;
    } else if (topPct > 60) {
      findings.push(
        `Moderate spend concentration: agent "${topAgent.agent_id}" accounts for ${topPct.toFixed(0)}% of total spend`
      );
      score += 1;
    }
  }

  // Budget violations
  if (summary.total_blocked > 0) {
    findings.push(
      `${summary.total_blocked} payment(s) were blocked by budget policies`
    );
    score += 1;
  }

  // Failed payments
  if (summary.total_failed > 0) {
    const failRate = (summary.total_failed / summary.total_payments) * 100;
    findings.push(
      `${summary.total_failed} failed payment(s) (${failRate.toFixed(1)}% failure rate)`
    );
    if (failRate > 5) {
      recommendations.push(
        "Investigate high failure rate — check endpoint availability and network conditions"
      );
      score += 2;
    } else {
      score += 1;
    }
  }

  // Receipt verification
  if (receipts.length > 0) {
    const verified = receipts.filter((r) => r.verified).length;
    const verifyRate = (verified / receipts.length) * 100;
    if (verifyRate < 100) {
      findings.push(
        `Receipt verification rate: ${verifyRate.toFixed(1)}% (${receipts.length - verified} unverified)`
      );
      recommendations.push("Investigate unverified receipts for potential integrity issues");
      score += 1;
    }
  }

  // No budget policies
  const activePolicies = policies.filter((p) => p.isActive);
  if (activePolicies.length === 0 && summary.total_payments > 0) {
    findings.push("No active budget policies configured");
    recommendations.push(
      "Create budget policies to set spending limits per agent or globally"
    );
    score += 1;
  }

  // Unresolved alerts
  const unresolvedAlerts = alerts.filter((a) => !a.resolved);
  if (unresolvedAlerts.length > 0) {
    findings.push(`${unresolvedAlerts.length} unresolved alert(s) in the period`);
    recommendations.push("Review and resolve outstanding alerts");
    score += 1;
  }

  // High-value payments without alerts
  if (summary.max_payment_usd > 50 && alerts.length === 0) {
    recommendations.push(
      "Enable alerts for high-value payments to improve oversight"
    );
  }

  // Many endpoints without policies
  if (summary.unique_endpoints > 5 && activePolicies.length < 2) {
    recommendations.push(
      `${summary.unique_endpoints} endpoints in use — consider endpoint-specific budget policies`
    );
  }

  // No findings = clean bill
  if (findings.length === 0) {
    findings.push("No significant risks identified in the review period");
  }

  const level: RiskAssessment["level"] =
    score >= 4 ? "High" : score >= 2 ? "Medium" : "Low";

  return { level, findings, recommendations };
}
