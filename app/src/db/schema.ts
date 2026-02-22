import {
  sqliteTable,
  text,
  integer,
  real,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

// teams table
export const teams = sqliteTable("teams", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  plan: text("plan").notNull().default("free"),
  apiKeyHash: text("api_key_hash").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

// agents table
export const agents = sqliteTable(
  "agents",
  {
    id: text("id").primaryKey(),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id),
    externalId: text("external_id").notNull(),
    name: text("name"),
    authorizedBy: text("authorized_by"),
    firstSeenAt: integer("first_seen_at", { mode: "timestamp_ms" }).notNull(),
    lastSeenAt: integer("last_seen_at", { mode: "timestamp_ms" }).notNull(),
    metadata: text("metadata", { mode: "json" }),
  },
  (t) => [uniqueIndex("agents_team_external_idx").on(t.teamId, t.externalId)]
);

// payments table
export const payments = sqliteTable(
  "payments",
  {
    id: text("id").primaryKey(),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id),
    agentId: text("agent_id")
      .notNull()
      .references(() => agents.id),
    url: text("url").notNull(),
    method: text("method").notNull(),
    endpointDomain: text("endpoint_domain").notNull(),
    status: text("status").notNull(),
    amount: text("amount"),
    amountUsd: real("amount_usd"),
    asset: text("asset"),
    network: text("network"),
    txHash: text("tx_hash"),
    scheme: text("scheme"),
    payTo: text("pay_to"),
    taskId: text("task_id"),
    category: text("category"),
    description: text("description"),
    tags: text("tags", { mode: "json" }),
    budgetEvaluation: text("budget_evaluation"),
    budgetViolation: text("budget_violation"),
    budgetUtilization: real("budget_utilization"),
    budgetSpent: text("budget_spent"),
    budgetLimit: text("budget_limit"),
    responseTimeMs: integer("response_time_ms"),
    timestamp: text("timestamp").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [
    index("payments_team_idx").on(t.teamId),
    index("payments_agent_idx").on(t.agentId),
    index("payments_timestamp_idx").on(t.timestamp),
    index("payments_status_idx").on(t.status),
    index("payments_category_idx").on(t.category),
    index("payments_network_idx").on(t.network),
    index("payments_domain_idx").on(t.endpointDomain),
    index("payments_team_timestamp_idx").on(t.teamId, t.timestamp),
  ]
);

// budgetPolicies table
export const budgetPolicies = sqliteTable("budget_policies", {
  id: text("id").primaryKey(),
  teamId: text("team_id")
    .notNull()
    .references(() => teams.id),
  agentExternalId: text("agent_external_id"),
  name: text("name").notNull(),
  policy: text("policy", { mode: "json" }).notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

// alerts table
export const alerts = sqliteTable(
  "alerts",
  {
    id: text("id").primaryKey(),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id),
    agentId: text("agent_id").references(() => agents.id),
    paymentId: text("payment_id").references(() => payments.id),
    type: text("type").notNull(),
    severity: text("severity").notNull(),
    message: text("message").notNull(),
    metadata: text("metadata", { mode: "json" }),
    resolved: integer("resolved", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [
    index("alerts_team_idx").on(t.teamId),
    index("alerts_severity_idx").on(t.severity),
  ]
);
