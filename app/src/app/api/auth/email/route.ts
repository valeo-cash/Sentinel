import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { nanoid } from "nanoid";
import { randomBytes } from "node:crypto";
import { db } from "@/db/client";
import { magicLinks } from "@/db/schema";

export async function POST(req: NextRequest) {
  const { email } = (await req.json()) as { email?: string };

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const token = randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await db.insert(magicLinks).values({
    id: `ml_${nanoid()}`,
    email: email.toLowerCase().trim(),
    token,
    expiresAt,
    used: false,
    createdAt: now,
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sentinel.valeocash.com";
  const link = `${appUrl}/auth/verify?token=${token}`;

  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    const resend = new Resend(resendKey);
    await resend.emails.send({
      from: "Sentinel <noreply@valeocash.com>",
      to: email.toLowerCase().trim(),
      subject: "Sign in to Sentinel",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 440px; margin: 0 auto; padding: 48px 24px; background: #0A0A0F; color: #FAFAFA;">
          <h2 style="color: #F59E0B; font-size: 18px; letter-spacing: 0.05em; margin: 0 0 24px;">SENTINEL</h2>
          <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #A1A1AA;">Click the button below to sign in to your Sentinel dashboard:</p>
          <a href="${link}" style="display: inline-block; background: #F59E0B; color: #0A0A0F; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
            Sign In to Sentinel
          </a>
          <p style="color: #52525B; font-size: 13px; margin: 28px 0 0; line-height: 1.5;">
            This link expires in 15 minutes.<br/>If you didn't request this, ignore this email.
          </p>
        </div>
      `,
    });
  }

  return NextResponse.json({ ok: true, message: "Magic link sent" });
}
