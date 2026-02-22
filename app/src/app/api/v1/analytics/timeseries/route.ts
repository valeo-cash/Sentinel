import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/server/auth";
import {
  getTimeseries,
  type TimeseriesBucket,
} from "@/server/analytics";
import { z } from "zod";

const querySchema = z.object({
  bucket: z.enum(["hour", "day", "week"]).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

function selectBucket(from?: string, to?: string): TimeseriesBucket {
  if (!from || !to) return "day";
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const diffHours = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60);
  const diffDays = diffHours / 24;
  if (diffHours < 48) return "hour";
  if (diffDays < 60) return "day";
  return "week";
}

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query params", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { from, to } = parsed.data;
  const bucket =
    parsed.data.bucket ?? selectBucket(from, to);

  const data = await getTimeseries(auth.team.id, bucket, { from, to });

  return NextResponse.json({ data });
}
