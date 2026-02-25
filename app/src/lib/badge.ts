import { db } from "@/db/client";
import { payments, agents } from "@/db/schema";
import { eq, sql, count } from "drizzle-orm";
import { NextResponse } from "next/server";

const VALID_ID = /^[a-zA-Z0-9._-]+$/;

const COLORS = {
  leftBg: "#1a1a2e",
  green: "#22c55e",
  yellow: "#eab308",
  gray: "#6b7280",
} as const;

const CACHE_HEADERS = {
  "Content-Type": "image/svg+xml",
  "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=60",
};

export function isValidAgentId(id: string): boolean {
  return id.length > 0 && id.length <= 128 && VALID_ID.test(id);
}

export async function getBadgeResponse(agentId: string): Promise<NextResponse> {
  if (!isValidAgentId(agentId)) {
    return svgResponse(generateBadgeSVG("Sentinel", "not found", COLORS.gray));
  }

  const [agent] = await db
    .select({ externalId: agents.externalId })
    .from(agents)
    .where(eq(agents.externalId, agentId))
    .limit(1);

  const [agg] = await db
    .select({
      totalPayments: count(),
      totalSpent: sql<number>`COALESCE(SUM(${payments.amountUsd}), 0)`,
    })
    .from(payments)
    .where(eq(payments.agentId, agent?.externalId ?? agentId));

  const total = Number(agg?.totalPayments ?? 0);
  const spent = Number(agg?.totalSpent ?? 0);

  if (total === 0) {
    return svgResponse(generateBadgeSVG("Sentinel", "no payments yet", COLORS.yellow));
  }

  const rightText = `${total} payment${total !== 1 ? "s" : ""} · $${spent.toFixed(2)} tracked`;
  return svgResponse(generateBadgeSVG("Sentinel", rightText, COLORS.green));
}

function svgResponse(svg: string): NextResponse {
  return new NextResponse(svg, { status: 200, headers: CACHE_HEADERS });
}

function measureTextWidth(text: string, fontSize: number): number {
  return text.length * fontSize * 0.62;
}

function generateBadgeSVG(leftText: string, rightText: string, rightColor: string): string {
  const fontSize = 11;
  const height = 20;
  const pad = 8;
  const shieldChar = "\u{1F6E1}";
  const shieldWidth = 14;

  const leftTextW = measureTextWidth(leftText, fontSize);
  const leftW = pad + shieldWidth + 4 + leftTextW + pad;
  const rightTextW = measureTextWidth(rightText, fontSize);
  const rightW = pad + rightTextW + pad;
  const totalW = leftW + rightW;

  const leftTextX = pad + shieldWidth + 4 + leftTextW / 2;
  const rightTextX = leftW + rightW / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${height}" role="img" aria-label="${leftText}: ${rightText}">
  <title>${leftText}: ${rightText}</title>
  <clipPath id="r"><rect width="${totalW}" height="${height}" rx="3"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${leftW}" height="${height}" fill="${COLORS.leftBg}"/>
    <rect x="${leftW}" width="${rightW}" height="${height}" fill="${rightColor}"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="${fontSize}" text-rendering="geometricPrecision">
    <text x="${pad + shieldWidth / 2}" y="14" font-size="10">${shieldChar}</text>
    <text x="${leftTextX}" y="14">${leftText}</text>
    <text x="${rightTextX}" y="14">${rightText}</text>
  </g>
</svg>`;
}
