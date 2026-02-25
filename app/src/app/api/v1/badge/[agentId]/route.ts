import { NextRequest } from "next/server";
import { getBadgeResponse } from "@/lib/badge";

export const revalidate = 300;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params;
  return getBadgeResponse(agentId);
}
