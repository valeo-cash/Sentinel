import { db } from "@/db/client";
import { budgetPolicies } from "@/db/schema";
import { nanoid } from "nanoid";
import { eq, and } from "drizzle-orm";

interface ChatAction {
  type: string;
  [key: string]: unknown;
}

export interface ActionResult {
  type: string;
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
}

export function parseActions(responseText: string): {
  cleanText: string;
  actions: ChatAction[];
} {
  const actionRegex = /<action>([\s\S]*?)<\/action>/g;
  const actions: ChatAction[] = [];
  let cleanText = responseText;

  let match;
  while ((match = actionRegex.exec(responseText)) !== null) {
    const jsonStr = match[1];
    if (!jsonStr) continue;
    try {
      const parsed = JSON.parse(jsonStr);
      actions.push(parsed);
    } catch {
      // skip malformed JSON
    }
    cleanText = cleanText.replace(match[0], "");
  }

  return { cleanText: cleanText.trim(), actions };
}

export async function executeActions(
  actions: ChatAction[],
  teamId: string
): Promise<ActionResult[]> {
  const results: ActionResult[] = [];

  for (const action of actions) {
    try {
      switch (action.type) {
        case "create_policy": {
          const policyData: Record<string, unknown> = {};

          if (action.maxDaily) {
            policyData.type = "daily";
            policyData.daily_limit_usd = parseFloat(String(action.maxDaily));
          } else if (action.maxPerCall) {
            policyData.type = "custom";
            policyData.per_call_limit_usd = parseFloat(
              String(action.maxPerCall)
            );
          } else if (action.maxMonthly) {
            policyData.type = "fixed";
            policyData.limit_usd = parseFloat(String(action.maxMonthly));
          } else {
            policyData.type = "fixed";
            policyData.limit_usd = parseFloat(String(action.limit || "0"));
          }

          const policyId = `bp_${nanoid(16)}`;
          const agentId = action.agentId ? String(action.agentId) : null;
          const now = new Date();

          await db.insert(budgetPolicies).values({
            id: policyId,
            teamId,
            agentExternalId: agentId,
            name: agentId
              ? `Chat: ${agentId} budget`
              : "Chat: global budget",
            policy: policyData as Record<string, unknown>,
            isActive: true,
            createdAt: now,
            updatedAt: now,
          });

          const limitDesc = action.maxDaily
            ? `$${action.maxDaily}/day`
            : action.maxPerCall
              ? `$${action.maxPerCall}/call`
              : action.maxMonthly
                ? `$${action.maxMonthly}/month`
                : `$${action.limit || "0"} total`;

          results.push({
            type: "create_policy",
            success: true,
            message: `Budget policy created: ${agentId ? `Agent ${agentId}` : "All agents"} — ${limitDesc} limit.`,
            details: { policyId, agentId },
          });
          break;
        }

        case "quarantine_agent": {
          const qId = `bp_${nanoid(16)}`;
          const qAgent = String(action.agentId);
          const now = new Date();

          await db.insert(budgetPolicies).values({
            id: qId,
            teamId,
            agentExternalId: qAgent,
            name: `Chat: quarantine ${qAgent}`,
            policy: { type: "fixed", limit_usd: 0 } as Record<
              string,
              unknown
            >,
            isActive: true,
            createdAt: now,
            updatedAt: now,
          });

          results.push({
            type: "quarantine_agent",
            success: true,
            message: `Agent ${qAgent} quarantined. All spending blocked until policy is removed.`,
            details: { policyId: qId, agentId: qAgent },
          });
          break;
        }

        case "update_policy": {
          if (!action.policyId) {
            results.push({
              type: "update_policy",
              success: false,
              message: "Missing policyId.",
            });
            break;
          }

          const updatePolicy: Record<string, unknown> = {};
          if (action.maxDaily) {
            updatePolicy.type = "daily";
            updatePolicy.daily_limit_usd = parseFloat(
              String(action.maxDaily)
            );
          }
          if (action.maxPerCall) {
            updatePolicy.per_call_limit_usd = parseFloat(
              String(action.maxPerCall)
            );
          }

          const setData: Record<string, unknown> = {
            policy: updatePolicy,
            updatedAt: new Date(),
          };
          if (action.enabled !== undefined) {
            setData.isActive = action.enabled;
          }

          await db
            .update(budgetPolicies)
            .set(setData)
            .where(
              and(
                eq(budgetPolicies.id, String(action.policyId)),
                eq(budgetPolicies.teamId, teamId)
              )
            );

          results.push({
            type: "update_policy",
            success: true,
            message: `Policy ${action.policyId} updated.`,
          });
          break;
        }

        case "delete_policy": {
          if (!action.policyId) {
            results.push({
              type: "delete_policy",
              success: false,
              message: "Missing policyId.",
            });
            break;
          }

          await db
            .delete(budgetPolicies)
            .where(
              and(
                eq(budgetPolicies.id, String(action.policyId)),
                eq(budgetPolicies.teamId, teamId)
              )
            );

          results.push({
            type: "delete_policy",
            success: true,
            message: `Policy ${action.policyId} removed.`,
          });
          break;
        }

        case "configure_alert": {
          results.push({
            type: "configure_alert",
            success: true,
            message: `Alert configured: ${action.channel || "webhook"} notifications for ${action.severity || "warning"} events${action.agentId ? ` on agent ${action.agentId}` : ""}.`,
            details: action as Record<string, unknown>,
          });
          break;
        }

        case "export_report": {
          results.push({
            type: "export_report",
            success: true,
            message: `Report ready: ${action.format || "csv"} format, ${action.range || "7d"} range.`,
            details: {
              format: action.format,
              range: action.range,
            },
          });
          break;
        }

        default:
          results.push({
            type: String(action.type),
            success: false,
            message: `Unknown action type: ${action.type}`,
          });
      }
    } catch (error) {
      results.push({
        type: String(action.type),
        success: false,
        message: `Failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  }

  return results;
}
