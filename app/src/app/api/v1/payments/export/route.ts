import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/server/auth";
import { db } from "@/db/client";
import { payments, agents } from "@/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const agentId = url.searchParams.get("agent_id");
  const category = url.searchParams.get("category");
  const network = url.searchParams.get("network");
  const status = url.searchParams.get("status");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const conditions = [eq(payments.teamId, auth.team.id)];
  if (agentId) conditions.push(eq(payments.agentId, agentId));
  if (category) conditions.push(eq(payments.category, category));
  if (network) conditions.push(eq(payments.network, network));
  if (status) conditions.push(eq(payments.status, status));
  if (from) conditions.push(gte(payments.timestamp, from));
  if (to) conditions.push(lte(payments.timestamp, to));

  const rows = await db
    .select({
      timestamp: payments.timestamp,
      agentExternalId: agents.externalId,
      endpoint: payments.url,
      method: payments.method,
      status: payments.status,
      amountUsd: payments.amountUsd,
      asset: payments.asset,
      network: payments.network,
      txHash: payments.txHash,
      category: payments.category,
      taskId: payments.taskId,
      description: payments.description,
    })
    .from(payments)
    .leftJoin(agents, eq(payments.agentId, agents.id))
    .where(and(...conditions))
    .orderBy(desc(payments.timestamp))
    .limit(10000);

  const headers = [
    "timestamp", "agent", "endpoint", "method", "status",
    "amount_usd", "asset", "network", "tx_hash", "category",
    "task_id", "description",
  ];

  const csvLines = [headers.join(",")];
  for (const row of rows) {
    const values = [
      row.timestamp,
      row.agentExternalId ?? "",
      csvEscape(row.endpoint),
      row.method,
      row.status,
      row.amountUsd?.toFixed(6) ?? "",
      row.asset ?? "",
      row.network ?? "",
      row.txHash ?? "",
      row.category ?? "",
      row.taskId ?? "",
      csvEscape(row.description ?? ""),
    ];
    csvLines.push(values.join(","));
  }

  const csv = csvLines.join("\n") + "\n";

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="sentinel-export.csv"',
    },
  });
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
