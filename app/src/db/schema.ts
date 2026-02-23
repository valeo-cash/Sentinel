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
  apiKeyHash: text("api_key_hash").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

// auth_accounts table — links wallet/email identities to teams
export const authAccounts = sqliteTable(
  "auth_accounts",
  {
    id: text("id").primaryKey(),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id),
    provider: text("provider").notNull(), // "wallet" | "email"
    providerId: text("provider_id").notNull(), // wallet address or email
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [uniqueIndex("auth_provider_id_idx").on(t.provider, t.providerId)]
);

// api_keys table — SDK/proxy API keys generated from dashboard
export const apiKeys = sqliteTable(
  "api_keys",
  {
    id: text("id").primaryKey(),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id),
    name: text("name").notNull(),
    keyHash: text("key_hash").notNull(),
    keyPrefix: text("key_prefix").notNull(), // first 8 chars for display
    lastUsedAt: integer("last_used_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [index("api_keys_team_idx").on(t.teamId)]
);

// magic_links table — email sign-in tokens (legacy, kept for migration compat)
export const magicLinks = sqliteTable("magic_links", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  used: integer("used", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

// email_codes table — 6-digit verification codes for email sign-in
export const emailCodes = sqliteTable("email_codes", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  code: text("code").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  used: integer("used", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
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
