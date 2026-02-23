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

    const digitCells = code
      .split("")
      .map(
        (d) =>
          `<td style="width:44px;height:52px;text-align:center;vertical-align:middle;background:#0f0f0f;border:1px solid #2e2e2e;border-radius:8px;font-family:'SF Mono','Fira Code','Courier New',monospace;font-size:32px;font-weight:700;color:#f3f0eb;">${d}</td>`,
      )
      .join('<td style="width:8px;"></td>');

    const resend = new Resend(resendKey);
    const { data, error } = await resend.emails.send({
      from: "Sentinel <noreply@sentinel.valeocash.com>",
      to: email.toLowerCase().trim(),
      subject: "Your Sentinel verification code",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 440px; margin: 0 auto; padding: 48px 24px; background: #191919; color: #FAFAFA; text-align: center;">
          <img src="https://sentinel.valeocash.com/sentinel_logo.png" alt="Sentinel" width="40" height="40" style="display:block;margin:0 auto 12px;" />
          <h2 style="color: #f3f0eb; font-size: 18px; letter-spacing: 0.05em; margin: 0 0 28px;">SENTINEL</h2>
          <p style="margin: 0 0 16px; font-size: 14px; color: #A1A1AA;">Your verification code is:</p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 28px;">
            <tr>${digitCells}</tr>
          </table>
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
