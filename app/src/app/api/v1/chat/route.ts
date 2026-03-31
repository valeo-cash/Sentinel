import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/server/auth";
import { gatherChatContext } from "@/server/chat-context";
import { parseActions, executeActions, type ActionResult } from "@/server/chat-actions";
import { db } from "@/db/client";
import { chatConversations, chatMessages } from "@/db/schema";
import { nanoid } from "nanoid";
import { eq, desc } from "drizzle-orm";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const SYSTEM_PROMPT = `You are Sentinel AI, a sharp financial analyst for AI agent payments. You have access to the user's complete x402 payment data. Your job is to answer questions about spending patterns, anomalies, and trends using specific numbers from the data provided.

Rules:
- Be specific with dollar amounts, agent names, endpoints, and timestamps. Never round unless asked.
- When you spot anomalies, explain what's normal vs abnormal by comparing to daily averages and historical patterns.
- Keep responses concise but data-rich. Lead with the answer, then explain.
- Format dollar amounts as $X.XX. Format dates as human-readable (e.g., "Tuesday at 3:42 PM UTC").
- When comparing periods, show the delta as both absolute and percentage.
- If the data doesn't contain enough information to answer confidently, say so. Never make up numbers.
- Agent names in the data use the "agent" field (their external/display ID). Always refer to agents by this name.

You can execute actions when the user asks. Return actions as JSON inside <action> tags:

<action>{"type":"create_policy","agentId":"agent-external-id","maxDaily":"50.00"}</action>
<action>{"type":"quarantine_agent","agentId":"agent-external-id"}</action>
<action>{"type":"configure_alert","channel":"slack","severity":"warning","agentId":"optional"}</action>
<action>{"type":"export_report","format":"pdf","range":"7d"}</action>
<action>{"type":"update_policy","policyId":"bp_xxx","maxDaily":"100.00"}</action>
<action>{"type":"delete_policy","policyId":"bp_xxx"}</action>

Only include <action> tags when the user explicitly asks you to DO something (create a policy, block an agent, set up an alert, export a report). Never include actions for informational questions.

After including an action tag, confirm what you did in plain English. Example: "Done. I've created a $50/day budget limit for researcher-01. Based on this week's data, this would have blocked $67.50 of spend."

Do not mention that you're an AI or that you're analyzing data. Just answer like a sharp financial analyst would.`;

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Chat not configured — ANTHROPIC_API_KEY is missing" },
      { status: 500 }
    );
  }

  let body: { message?: string; conversationId?: string; history?: Array<{ role: string; content: string }> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { message, conversationId, history } = body;

  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  try {
    const context = await gatherChatContext(auth.team.id);

    const contextBlock = `Here is the user's current payment data as of ${context.metadata.dataAsOf}:

SUMMARY:
- Total spend (all time): $${context.summary.totalSpendAllTime.toFixed(2)}
- Total spend (today): $${context.summary.totalSpendToday.toFixed(2)}
- Total spend (this week): $${context.summary.totalSpendThisWeek.toFixed(2)}
- Daily average (30-day): $${context.summary.dailyAverage.toFixed(2)}
- Total payments: ${context.summary.totalPayments}
- Active agents: ${context.summary.uniqueAgents}
- Unique endpoints: ${context.summary.uniqueEndpoints}

AGENTS (with total spend):
${JSON.stringify(context.agents, null, 2)}

TOP AGENTS THIS WEEK:
${JSON.stringify(context.topAgentsThisWeek, null, 2)}

RECENT PAYMENTS (last 100):
${JSON.stringify(context.recentPayments, null, 2)}

SPEND BY ENDPOINT:
${JSON.stringify(context.spendByEndpoint, null, 2)}

DAILY SPEND (last 30 days):
${JSON.stringify(context.dailySpend, null, 2)}

ACTIVE POLICIES:
${JSON.stringify(context.policies, null, 2)}

RECENT ALERTS:
${JSON.stringify(context.alerts, null, 2)}

FAILED/BLOCKED PAYMENTS:
${JSON.stringify(context.failedPayments, null, 2)}`;

    const messages: Array<{ role: string; content: string }> = [];

    if (history && Array.isArray(history)) {
      for (const msg of history) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    messages.push({
      role: "user",
      content: `${contextBlock}\n\n---\n\nUser question: ${message}`,
    });

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Anthropic API error:", response.status, errorBody);
      return NextResponse.json(
        { error: "Failed to get AI response" },
        { status: 502 }
      );
    }

    const data = await response.json();
    const rawResponse = data.content
      .map((block: { type: string; text?: string }) =>
        block.type === "text" ? block.text : ""
      )
      .filter(Boolean)
      .join("\n");

    const { cleanText, actions } = parseActions(rawResponse);

    let actionResults: ActionResult[] = [];
    if (actions.length > 0) {
      actionResults = await executeActions(actions, auth.team.id);
    }

    let convId = conversationId;
    if (!convId) {
      convId = `chat_${nanoid(16)}`;
      await db.insert(chatConversations).values({
        id: convId,
        teamId: auth.team.id,
        title: message.slice(0, 100),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else {
      await db
        .update(chatConversations)
        .set({ updatedAt: new Date() })
        .where(eq(chatConversations.id, convId));
    }

    await db.insert(chatMessages).values({
      id: `msg_${nanoid(16)}`,
      conversationId: convId,
      role: "user",
      content: message,
      createdAt: new Date(),
    });

    await db.insert(chatMessages).values({
      id: `msg_${nanoid(16)}`,
      conversationId: convId,
      role: "assistant",
      content: cleanText,
      actions: actionResults.length > 0 ? JSON.stringify(actionResults) : null,
      createdAt: new Date(),
    });

    return NextResponse.json({
      conversationId: convId,
      message: cleanText,
      actions: actionResults.length > 0 ? actionResults : undefined,
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId");

  if (conversationId) {
    const msgs = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, conversationId))
      .orderBy(chatMessages.createdAt);

    return NextResponse.json({ messages: msgs });
  }

  const conversations = await db
    .select()
    .from(chatConversations)
    .where(eq(chatConversations.teamId, auth.team.id))
    .orderBy(desc(chatConversations.updatedAt))
    .limit(20);

  return NextResponse.json({ conversations });
}
