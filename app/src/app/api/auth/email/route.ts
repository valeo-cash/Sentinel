import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { nanoid } from "nanoid";
import { randomBytes } from "node:crypto";
import { db } from "@/db/client";
import { magicLinks } from "@/db/schema";

export async function POST(req: NextRequest) {
  try {
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
    if (!resendKey) {
      console.error("RESEND_API_KEY is not set");
      return NextResponse.json({ ok: false, error: "Email service not configured" }, { status: 500 });
    }

    const resend = new Resend(resendKey);
    const { data, error } = await resend.emails.send({
      from: "Sentinel <noreply@sentinel.valeocash.com>",
      to: email.toLowerCase().trim(),
      subject: "Sign in to Sentinel",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 440px; margin: 0 auto; padding: 48px 24px; background: #191919; color: #FAFAFA;">
          <h2 style="color: #f3f0eb; font-size: 18px; letter-spacing: 0.05em; margin: 0 0 24px;">SENTINEL</h2>
          <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #A1A1AA;">Click the button below to sign in to your Sentinel dashboard:</p>
          <a href="${link}" style="display: inline-block; background: #f3f0eb; color: #191919; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
            Sign In to Sentinel
          </a>
          <p style="color: #52525B; font-size: 13px; margin: 28px 0 0; line-height: 1.5;">
            This link expires in 15 minutes.<br/>If you didn't request this, ignore this email.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ ok: false, error: "Failed to send magic link. Please try again." }, { status: 500 });
    }

    console.log("Email sent:", data);
    return NextResponse.json({ ok: true, message: "Magic link sent" });
  } catch (err) {
    console.error("Email auth error:", err);
    return NextResponse.json({ error: "Failed to send magic link. Please try again." }, { status: 500 });
  }
}
