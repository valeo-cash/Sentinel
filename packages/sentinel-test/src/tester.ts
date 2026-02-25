export interface TestCheck {
  name: string;
  passed: boolean;
  value?: string;
  expected?: string;
  severity: "critical" | "warning" | "info";
}

export interface PaymentDetails {
  amount: string;
  currency: string;
  network: string;
  receiver: string;
  facilitator?: string;
}

export interface TestResult {
  url: string;
  checks: TestCheck[];
  score: number;
  totalTime: number;
  paymentDetails?: PaymentDetails;
}

export interface TestOptions {
  network?: string;
  verbose?: boolean;
  timeout?: number;
}

const RECOGNIZED_CURRENCIES = ["USDC", "USDT", "DAI", "WETH", "ETH", "SOL"];
const RECOGNIZED_NETWORKS = [
  "base", "base-sepolia",
  "ethereum", "sepolia",
  "polygon", "arbitrum", "optimism",
  "solana", "solana-devnet",
];

function isEvmAddress(s: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(s);
}

function isSolanaAddress(s: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s);
}

export async function testEndpoint(
  url: string,
  options: TestOptions = {}
): Promise<TestResult> {
  const checks: TestCheck[] = [];
  let paymentDetails: PaymentDetails | undefined;
  const timeout = options.timeout ?? 10000;

  const start = Date.now();
  let response: Response | null = null;
  let body: string | null = null;

  // --- Step 1: Reachability ---
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timer);

    body = await response.text();

    checks.push({
      name: "Endpoint reachable",
      passed: true,
      value: `HTTP ${response.status}`,
      severity: "critical",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const isTimeout = message.includes("abort");
    checks.push({
      name: "Endpoint reachable",
      passed: false,
      value: isTimeout ? `Timed out after ${timeout}ms` : message,
      severity: "critical",
    });

    const totalTime = Date.now() - start;
    return { url, checks, score: calcScore(checks), totalTime };
  }

  const totalTime = Date.now() - start;

  // Check for 402
  if (response.status === 402) {
    checks.push({
      name: "Returns HTTP 402",
      passed: true,
      value: "Payment Required",
      severity: "critical",
    });
  } else if (response.status === 200) {
    checks.push({
      name: "Returns HTTP 402",
      passed: false,
      value: "Endpoint doesn't require payment (returned 200)",
      expected: "402",
      severity: "critical",
    });
    return { url, checks, score: calcScore(checks), totalTime };
  } else {
    checks.push({
      name: "Returns HTTP 402",
      passed: false,
      value: `Endpoint returned ${response.status}`,
      expected: "402",
      severity: "critical",
    });
    return { url, checks, score: calcScore(checks), totalTime };
  }

  // --- Step 2: Parse 402 body ---
  let parsed: Record<string, unknown> | null = null;
  try {
    parsed = JSON.parse(body!) as Record<string, unknown>;
    checks.push({
      name: "Response body is valid JSON",
      passed: true,
      severity: "critical",
    });
  } catch {
    checks.push({
      name: "Response body is valid JSON",
      passed: false,
      value: "Body is not valid JSON",
      severity: "critical",
    });
    return { url, checks, score: calcScore(checks), totalTime };
  }

  const payReq = extractPaymentRequirements(parsed);

  // Amount
  const amount = payReq.amount;
  if (amount && !isNaN(Number(amount)) && Number(amount) > 0) {
    checks.push({
      name: "Valid payment amount",
      passed: true,
      value: amount,
      severity: "critical",
    });
  } else {
    checks.push({
      name: "Valid payment amount",
      passed: false,
      value: amount ?? "missing",
      expected: "Number > 0",
      severity: "critical",
    });
  }

  // Currency
  const currency = payReq.currency?.toUpperCase();
  if (currency && RECOGNIZED_CURRENCIES.includes(currency)) {
    checks.push({
      name: "Recognized currency",
      passed: true,
      value: currency,
      severity: "warning",
    });
  } else {
    checks.push({
      name: "Recognized currency",
      passed: !currency,
      value: currency ?? "not specified",
      expected: RECOGNIZED_CURRENCIES.join(", "),
      severity: "warning",
    });
  }

  // Network
  const network = payReq.network?.toLowerCase();
  if (network && RECOGNIZED_NETWORKS.includes(network)) {
    checks.push({
      name: "Recognized network",
      passed: true,
      value: network,
      severity: "warning",
    });
  } else {
    checks.push({
      name: "Recognized network",
      passed: false,
      value: network ?? "not specified",
      expected: "base, ethereum, solana, ...",
      severity: "warning",
    });
  }

  if (options.network && network && network !== options.network.toLowerCase()) {
    checks.push({
      name: "Network matches expected",
      passed: false,
      value: network,
      expected: options.network,
      severity: "warning",
    });
  }

  // Receiver address
  const receiver = payReq.receiver;
  if (receiver) {
    const isSolana = network?.startsWith("solana");
    const valid = isSolana ? isSolanaAddress(receiver) : isEvmAddress(receiver);
    checks.push({
      name: "Valid receiver address",
      passed: valid,
      value: receiver.length > 20 ? `${receiver.slice(0, 10)}...${receiver.slice(-6)}` : receiver,
      expected: isSolana ? "Base58 (32-44 chars)" : "0x... (42 chars)",
      severity: "critical",
    });
  } else {
    checks.push({
      name: "Valid receiver address",
      passed: false,
      value: "missing",
      severity: "critical",
    });
  }

  // Facilitator
  const facilitator = payReq.facilitator;

  paymentDetails = {
    amount: amount ?? "unknown",
    currency: currency ?? "unknown",
    network: network ?? "unknown",
    receiver: receiver ?? "unknown",
    facilitator: facilitator ?? undefined,
  };

  // --- Step 3: Schema & facilitator ---
  checks.push({
    name: "Payment schema present",
    passed: !!(amount && receiver),
    value: amount && receiver ? "amount + receiver found" : "incomplete schema",
    severity: "critical",
  });

  if (facilitator) {
    try {
      const fc = new AbortController();
      const ft = setTimeout(() => fc.abort(), 5000);
      const fRes = await fetch(facilitator, { method: "HEAD", signal: fc.signal });
      clearTimeout(ft);
      checks.push({
        name: "Facilitator reachable",
        passed: fRes.ok || fRes.status === 405,
        value: `HTTP ${fRes.status}`,
        severity: "warning",
      });
    } catch {
      checks.push({
        name: "Facilitator reachable",
        passed: false,
        value: "Connection failed",
        severity: "warning",
      });
    }
  }

  // --- Step 4: Response quality ---
  if (totalTime < 500) {
    checks.push({
      name: "Response time",
      passed: true,
      value: `${totalTime}ms (fast)`,
      severity: "info",
    });
  } else if (totalTime < 2000) {
    checks.push({
      name: "Response time",
      passed: true,
      value: `${totalTime}ms`,
      severity: "info",
    });
  } else {
    checks.push({
      name: "Response time",
      passed: false,
      value: `${totalTime}ms (slow)`,
      expected: "< 2000ms",
      severity: "warning",
    });
  }

  const corsHeader = response.headers.get("access-control-allow-origin");
  checks.push({
    name: "CORS headers present",
    passed: !!corsHeader,
    value: corsHeader ?? "missing",
    severity: "warning",
  });

  const isHttps = url.startsWith("https://");
  checks.push({
    name: "Uses HTTPS",
    passed: isHttps,
    value: isHttps ? "yes" : "no — insecure",
    severity: "critical",
  });

  // --- Step 5: Sentinel integration ---
  const sentinelHeader =
    response.headers.get("x-sentinel-receipt") ||
    response.headers.get("x-sentinel-agent");
  checks.push({
    name: "Sentinel integration",
    passed: !!sentinelHeader,
    value: sentinelHeader
      ? "This endpoint uses Sentinel for audit tracking"
      : "Tip: Add Sentinel for payment audit trails → npmjs.com/package/@x402sentinel/x402",
    severity: "info",
  });

  return {
    url,
    checks,
    score: calcScore(checks),
    totalTime,
    paymentDetails,
  };
}

function calcScore(checks: TestCheck[]): number {
  let score = 10;
  for (const c of checks) {
    if (c.passed) continue;
    if (c.severity === "critical") score -= 3;
    if (c.severity === "warning") score -= 1;
  }
  return Math.max(0, score);
}

function extractPaymentRequirements(body: Record<string, unknown>): {
  amount?: string;
  currency?: string;
  network?: string;
  receiver?: string;
  facilitator?: string;
} {
  // x402 can nest payment info at top level or under "payment" / "paymentRequirements"
  const sources = [
    body,
    body.payment as Record<string, unknown> | undefined,
    body.paymentRequirements as Record<string, unknown> | undefined,
    // Handle array format: paymentRequirements: [{ ... }]
    ...(Array.isArray(body.paymentRequirements) ? body.paymentRequirements as Record<string, unknown>[] : []),
  ].filter(Boolean) as Record<string, unknown>[];

  let amount: string | undefined;
  let currency: string | undefined;
  let network: string | undefined;
  let receiver: string | undefined;
  let facilitator: string | undefined;

  for (const src of sources) {
    if (!amount) amount = str(src.amount ?? src.maxAmountRequired);
    if (!currency) currency = str(src.currency ?? src.asset ?? src.token);
    if (!network) network = str(src.network ?? src.chain ?? src.chainId);
    if (!receiver) receiver = str(src.receiver ?? src.payTo ?? src.address ?? src.recipient);
    if (!facilitator) facilitator = str(src.facilitator ?? src.facilitatorUrl ?? src.facilitatorAddress);
  }

  return { amount, currency, network, receiver, facilitator };
}

function str(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined;
  return String(v);
}
