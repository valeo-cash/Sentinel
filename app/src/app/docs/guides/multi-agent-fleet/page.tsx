import { DocPage } from "@/components/docs/doc-page";

export default function MultiAgentFleetPage() {
  return (
    <DocPage
      title="Multi-Agent Fleet"
      description="Managing multiple agents with shared budgets."
    >
      <div className="prose prose-invert max-w-none">
        <p>
          When you have multiple agents, you can share a single storage backend
          and optionally enforce team-level budgets.
        </p>

        <h2>Shared Storage</h2>
        <p>
          Create one storage instance and pass it to all agents. All audit
          records go to the same place:
        </p>
        <pre>
          <code>{`import { MemoryStorage, wrapWithSentinel, standardPolicy } from "@valeo/x402";

const sharedStorage = new MemoryStorage(50_000);

const agent1Fetch = wrapWithSentinel(fetchWithPayment, {
  agentId: "agent-weather-001",
  team: "data-ops",
  budget: standardPolicy(),
  audit: { storage: sharedStorage },
});

const agent2Fetch = wrapWithSentinel(fetchWithPayment, {
  agentId: "agent-llm-002",
  team: "data-ops",
  budget: standardPolicy(),
  audit: { storage: sharedStorage },
});`}</code>
        </pre>

        <h2>Team-Level Queries</h2>
        <p>Use SentinelDashboard to query by team:</p>
        <pre>
          <code>{`import { SentinelDashboard } from "@valeo/x402/dashboard";

const dashboard = new SentinelDashboard({ storage: sharedStorage });

const report = await dashboard.getSpend({
  team: "data-ops",
  range: "last_day",
});

const agents = await dashboard.getAgents();`}</code>
        </pre>

        <h2>Per-Agent vs Team Budgets</h2>
        <p>
          Sentinel enforces budgets <strong>per agent</strong>. Each
          wrapWithSentinel call gets its own BudgetManager. There is no built-in
          shared team budget yet.
        </p>

        <h3>Workaround: Custom beforePayment Hook</h3>
        <p>Use a custom hook to check team-level spend:</p>
        <pre>
          <code>{`import { spendByTeam } from "@valeo/x402/dashboard";

const agentFetch = wrapWithSentinel(fetchWithPayment, {
  agentId: "agent-1",
  team: "data-ops",
  budget: standardPolicy(),
  audit: { storage: sharedStorage },
  hooks: {
    beforePayment: async (ctx) => {
      const result = await spendByTeam(sharedStorage, "data-ops", "last_day");
      if (parseFloat(result.spend) > 1000) {
        return { proceed: false, reason: "Team daily limit exceeded" };
      }
      return { proceed: true };
    },
  },
});`}</code>
        </pre>

        <h2>Dashboard for Fleet</h2>
        <p>One dashboard instance can serve all agents:</p>
        <pre>
          <code>{`const dashboard = new SentinelDashboard({ storage: sharedStorage });

const topSpenders = await dashboard.getAgents();
const alerts = await dashboard.getAlerts();`}</code>
        </pre>
      </div>
    </DocPage>
  );
}
