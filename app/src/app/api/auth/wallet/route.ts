import { NextRequest, NextResponse } from "next/server";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { nanoid } from "nanoid";
import { db } from "@/db/client";
import { teams, authAccounts } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { createSessionToken, setSessionCookie } from "@/server/session";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { publicKey, signature, message } = body as {
    publicKey: string;
    signature: string;
    message: string;
  };

  if (!publicKey || !signature || !message) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const messageBytes = new TextEncoder().encode(message);
  const signatureBytes = Buffer.from(signature, "base64");
  let publicKeyBytes: Uint8Array;
  try {
    publicKeyBytes = bs58.decode(publicKey);
  } catch {
    return NextResponse.json({ error: "Invalid public key" }, { status: 400 });
  }

  const isValid = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const timestampMatch = message.match(/Timestamp: (.+)/);
  if (timestampMatch) {
    const signedAt = new Date(timestampMatch[1]!).getTime();
    if (Date.now() - signedAt > 5 * 60 * 1000) {
      return NextResponse.json({ error: "Signature expired" }, { status: 401 });
    }
  }

  const [existing] = await db
    .select()
    .from(authAccounts)
    .where(and(eq(authAccounts.provider, "wallet"), eq(authAccounts.providerId, publicKey)))
    .limit(1);

  let teamId: string;

  if (existing) {
    teamId = existing.teamId;
  } else {
    teamId = `team_${nanoid()}`;
    const now = new Date();
    const teamName = `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`;

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
      providerId: publicKey,
      createdAt: now,
    });
  }

  const token = await createSessionToken(teamId, { wallet: publicKey });
  const response = NextResponse.json({ ok: true });
  return setSessionCookie(response, token);
}
