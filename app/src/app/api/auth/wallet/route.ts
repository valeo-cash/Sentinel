import { NextRequest, NextResponse } from "next/server";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { verifyMessage } from "ethers";
import { nanoid } from "nanoid";
import { db } from "@/db/client";
import { teams, authAccounts } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { createSessionToken, setSessionCookie } from "@/server/session";

function validateTimestamp(message: string): boolean {
  const timestampMatch = message.match(/Timestamp: (.+)/);
  if (!timestampMatch) return true;
  const signedAt = new Date(timestampMatch[1]!).getTime();
  return Date.now() - signedAt <= 5 * 60 * 1000;
}

function verifySolana(publicKey: string, signature: string, message: string): boolean {
  const messageBytes = new TextEncoder().encode(message);
  const signatureBytes = Buffer.from(signature, "base64");
  let publicKeyBytes: Uint8Array;
  try {
    publicKeyBytes = bs58.decode(publicKey);
  } catch {
    return false;
  }
  return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
}

function verifyEvm(address: string, signature: string, message: string): boolean {
  try {
    const recovered = verifyMessage(message, signature);
    return recovered.toLowerCase() === address.toLowerCase();
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { publicKey, signature, message, walletType } = body as {
      publicKey: string;
      signature: string;
      message: string;
      walletType?: "solana" | "evm";
    };

    if (!publicKey || !signature || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!validateTimestamp(message)) {
      return NextResponse.json({ error: "Signature expired" }, { status: 401 });
    }

    const type = walletType ?? "solana";
    let isValid = false;

    if (type === "evm") {
      isValid = verifyEvm(publicKey, signature, message);
    } else {
      isValid = verifySolana(publicKey, signature, message);
    }

    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const providerId = type === "evm" ? publicKey.toLowerCase() : publicKey;

    const [existing] = await db
      .select()
      .from(authAccounts)
      .where(and(eq(authAccounts.provider, "wallet"), eq(authAccounts.providerId, providerId)))
      .limit(1);

    let teamId: string;

    if (existing) {
      teamId = existing.teamId;
    } else {
      teamId = `team_${nanoid()}`;
      const now = new Date();
      const teamName = `${publicKey.slice(0, 6)}...${publicKey.slice(-4)}`;

      await db.insert(teams).values({
        id: teamId,
        name: teamName,
        plan: "free",
        apiKeyHash: "",
        createdAt: now,
        updatedAt: now,
      });

      await db.insert(authAccounts).values({
        id: `auth_${nanoid()}`,
        teamId,
        provider: "wallet",
        providerId,
        createdAt: now,
      });
    }

    const token = await createSessionToken(teamId, { wallet: publicKey });
    const response = NextResponse.json({ ok: true });
    return setSessionCookie(response, token);
  } catch (err) {
    console.error("Wallet auth error:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
