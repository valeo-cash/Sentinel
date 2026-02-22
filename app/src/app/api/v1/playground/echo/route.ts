import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { authenticateRequest } from "@/server/auth";

const FAKE_PAY_TO = "0x1a2b3c4d5e6f7890abcdef1234567890abcdef12";

function buildPaymentRequirement(network: string) {
  const amount = String(Math.floor(Math.random() * 4000 + 1000)); // 1000-5000 base units ($0.001-$0.005)
  const requirement = {
    accepts: [
      {
        scheme: "exact",
        network,
        maxAmountRequired: amount,
        asset: "USDC",
        payTo: FAKE_PAY_TO,
        maxTimeoutSeconds: 30,
      },
    ],
  };
  return { encoded: Buffer.from(JSON.stringify(requirement)).toString("base64"), amount };
}

function buildPaymentResponse(network: string, amount: string) {
  const response = {
    success: true,
    txHash: `0x${nanoid(64)}`,
    network,
    amount,
    asset: "USDC",
    scheme: "exact",
    payTo: FAKE_PAY_TO,
  };
  return { encoded: Buffer.from(JSON.stringify(response)).toString("base64"), parsed: response };
}

async function handleEcho(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const network = request.headers.get("x-playground-network") || "eip155:84532";
  const paymentHeader = request.headers.get("payment") || request.headers.get("x-payment");

  if (paymentHeader) {
    const { encoded, parsed } = buildPaymentResponse(network, "10000");

    let body: unknown = null;
    try {
      body = await request.json();
    } catch {
      body = null;
    }

    return NextResponse.json(
      {
        echo: true,
        method: request.method,
        timestamp: new Date().toISOString(),
        body,
        message: "Payment accepted. This is a simulated echo response from Sentinel Playground.",
        payment: {
          txHash: parsed.txHash,
          amount: parsed.amount,
          network: parsed.network,
          asset: parsed.asset,
        },
      },
      {
        status: 200,
        headers: {
          "PAYMENT-RESPONSE": encoded,
          "X-Sentinel-Echo": "true",
        },
      }
    );
  }

  const { encoded } = buildPaymentRequirement(network);

  return NextResponse.json(
    {
      error: "Payment Required",
      message: "This endpoint requires x402 payment. Send a Payment header to proceed.",
      accepts: JSON.parse(Buffer.from(encoded, "base64").toString("utf-8")).accepts,
    },
    {
      status: 402,
      headers: {
        "X-PAYMENT": encoded,
        "X-Sentinel-Echo": "true",
      },
    }
  );
}

export const GET = handleEcho;
export const POST = handleEcho;
export const PUT = handleEcho;
export const DELETE = handleEcho;
export const PATCH = handleEcho;
