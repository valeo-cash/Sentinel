import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/server/auth";
import { timeRangeSchema } from "@/server/validation";
import { getByEndpoint } from "@/server/analytics";

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = timeRangeSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query params", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = await getByEndpoint(auth.team.id, {
    from: parsed.data.from,
    to: parsed.data.to,
  });

  return NextResponse.json({ data });
}
