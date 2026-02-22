import { DocPage } from "@/components/docs/doc-page";

export default function DashboardPoliciesPage() {
  return (
    <DocPage
      title="Policies"
      description="Creating and managing budget policies in the dashboard."
    >
      <div className="prose prose-invert max-w-none">
        <p>
          Budget policies are configured in code via wrapWithSentinel. The
          dashboard does not edit policies — it surfaces the{" "}
          <strong>effects</strong> of policies (violations, blocked payments,
          anomalies).
        </p>

        <h2>Policy Effects in the Dashboard</h2>
        <table>
          <thead>
            <tr>
              <th>Dashboard Feature</th>
              <th>Policy Connection</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>getAlerts()</code></td>
              <td>Violations = blocked payments; Anomalies = spike/flagged</td>
            </tr>
            <tr>
              <td><code>violations()</code></td>
              <td>Records with policy_evaluation: &quot;blocked&quot;</td>
            </tr>
            <tr>
              <td><code>anomalies()</code></td>
              <td>Records flagged by spike detection or custom logic</td>
            </tr>
            <tr>
              <td><code>policy_evaluation</code> on records</td>
              <td>&quot;allowed&quot; | &quot;flagged&quot; | &quot;blocked&quot;</td>
            </tr>
          </tbody>
        </table>

        <h2>Viewing Violations</h2>
        <pre>
          <code>{`const alerts = await dashboard.getAlerts();
const violationAlerts = alerts.filter((a) => a.type === "violation");

import { violations } from "@x402sentinel/x402/dashboard";
const blockedRecords = await violations(storage, "last_day");`}</code>
        </pre>

        <p>
          Each violation has a BudgetViolation with type, limit, current,
          attempted, agentId, endpoint, timestamp.
        </p>

        <h2>Policy Configuration</h2>
        <p>
          Policies are set in code. See{" "}
          <a href="/docs/sdk/budget-policies">Budget Policies</a> for the full
          reference. The dashboard cannot change them — use wrapWithSentinel
          config and redeploy.
        </p>

        <h2>Budget Remaining</h2>
        <p>
          Each successful payment record includes budget_remaining — the
          remaining budget in the relevant window after that payment.
        </p>
        <pre>
          <code>{`const records = await logger.query({
  agentId: "agent-1",
  limit: 1,
  orderBy: "created_at",
  order: "desc",
});
const lastRecord = records[0];
console.log("Budget remaining:", lastRecord.budget_remaining);`}</code>
        </pre>
      </div>
    </DocPage>
  );
}
