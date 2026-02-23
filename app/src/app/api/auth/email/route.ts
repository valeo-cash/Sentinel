import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { nanoid } from "nanoid";
import { randomInt } from "node:crypto";
import { db } from "@/db/client";
import { emailCodes } from "@/db/schema";

export async function POST(req: NextRequest) {
  try {
    const { email } = (await req.json()) as { email?: string };

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const code = String(randomInt(100000, 999999));
    const now = new Date();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db.insert(emailCodes).values({
      id: `ec_${nanoid()}`,
      email: email.toLowerCase().trim(),
      code,
      expiresAt,
      used: false,
      createdAt: now,
    });

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      console.error("RESEND_API_KEY is not set");
      return NextResponse.json({ ok: false, error: "Email service not configured" }, { status: 500 });
    }

    const spaced = code.split("").join(" \u2009");

    const resend = new Resend(resendKey);
    const { data, error } = await resend.emails.send({
      from: "Sentinel <noreply@sentinel.valeocash.com>",
      to: email.toLowerCase().trim(),
      subject: "Your Sentinel verification code",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 440px; margin: 0 auto; padding: 48px 24px; background: #191919; color: #FAFAFA; text-align: center;">
          <h2 style="color: #f3f0eb; font-size: 18px; letter-spacing: 0.05em; margin: 0 0 28px;">SENTINEL</h2>
          <p style="margin: 0 0 8px; font-size: 14px; color: #A1A1AA;">Your verification code is:</p>
          <div style="background: #111111; border: 1px solid #2e2e2e; border-radius: 12px; padding: 24px 16px; margin: 16px 0 28px;">
            <span style="font-family: 'SF Mono', 'Fira Code', 'Courier New', monospace; font-size: 36px; font-weight: 700; letter-spacing: 0.25em; color: #f3f0eb;">${spaced}</span>
          </div>
          <p style="color: #52525B; font-size: 13px; margin: 0; line-height: 1.5;">
            This code expires in 10 minutes.<br/>If you didn't request this, ignore this email.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ ok: false, error: "Failed to send verification code. Please try again." }, { status: 500 });
    }

    console.log("Verification code email sent:", data);
    return NextResponse.json({ ok: true, message: "Verification code sent" });
  } catch (err) {
    console.error("Email auth error:", err);
    return NextResponse.json({ error: "Failed to send verification code. Please try again." }, { status: 500 });
  }
}
