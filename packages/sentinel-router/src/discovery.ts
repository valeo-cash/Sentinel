import type {
  DiscoveredPayment,
  ProbeResult,
  RouteEndpoint,
  PaymentRouterOptions,
} from "./types.js";

const USDC_TOKENS: Record<string, { symbol: string; decimals: number }> = {
  "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913": { symbol: "USDC", decimals: 6 },
  "0x036cbd53842c5426634e7929541ec2318f3dcf7e": { symbol: "USDC", decimals: 6 },
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": { symbol: "USDC", decimals: 6 },
  "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359": { symbol: "USDC", decimals: 6 },
  "0xaf88d065e77c8cc2239327c5edb3a432268e5831": { symbol: "USDC", decimals: 6 },
};

const CAIP2_MAP: Record<string, string> = {
  "eip155:8453": "base",
  "eip155:84532": "base-sepolia",
  "eip155:1": "ethereum",
  "eip155:11155111": "sepolia",
  "eip155:137": "polygon",
  "eip155:42161": "arbitrum",
  "8453": "base",
  "84532": "base-sepolia",
  "1": "ethereum",
  "11155111": "sepolia",
  "137": "polygon",
  "42161": "arbitrum",
};

function resolveNetwork(raw: string): string {
  return CAIP2_MAP[raw] ?? raw;
}

function resolveTokenSymbol(
  address: string | undefined,
  network: string,
  options?: Pick<PaymentRouterOptions, "resolveToken">,
): string {
  if (!address) return "UNKNOWN";
  const lower = address.toLowerCase();
  const builtin = USDC_TOKENS[lower];
  if (builtin) return builtin.symbol;
  const custom = options?.resolveToken?.(lower, network);
  if (custom) return custom.symbol;
  return "UNKNOWN";
}

function parseUsdAmount(raw: string): number {
  const cleaned = raw.replace(/[^0-9.]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

function headersToDict(headers: Headers): Record<string, string> {
  const dict: Record<string, string> = {};
  headers.forEach((v, k) => { dict[k] = v; });
  return dict;
}

function tryParsePaymentRequired(
  headers: Headers,
  _body: string,
  options?: Pick<PaymentRouterOptions, "resolveToken">,
): DiscoveredPayment | null {
  const pr = headers.get("payment-required");
  if (!pr) return null;

  try {
    const decoded = JSON.parse(Buffer.from(pr, "base64").toString("utf-8"));
    const accepts = Array.isArray(decoded.accepts) ? decoded.accepts : [decoded];
    const first = accepts[0];
    if (!first) return null;

    const network = resolveNetwork(first.network ?? "");
    const tokenAddress = first.token ?? first.tokenAddress;
    const currency = first.currency ?? resolveTokenSymbol(tokenAddress, network, options);

    return {
      url: "",
      amountRaw: String(first.price ?? first.amount ?? "0"),
      amountUsd: parseUsdAmount(String(first.price ?? first.amount ?? "0")),
      currency,
      tokenAddress,
      network,
      payTo: first.payTo ?? first.address ?? "",
      scheme: first.scheme,
      facilitator: first.facilitator,
      parseConfidence: "high",
      raw: { headers: {}, body: "" },
    };
  } catch {
    return null;
  }
}

function tryParseWWWAuthenticate(
  headers: Headers,
  _body: string,
  options?: Pick<PaymentRouterOptions, "resolveToken">,
): DiscoveredPayment | null {
  const wwwAuth = headers.get("www-authenticate");
  if (!wwwAuth || !wwwAuth.toLowerCase().includes("x402")) return null;

  const addressMatch = wwwAuth.match(/address="?([^"\s]+)"?/i);
  const amountMatch = wwwAuth.match(/amount="?([^"\s]+)"?/i);
  const chainIdMatch = wwwAuth.match(/chainId="?([^"\s]+)"?/i);
  const tokenMatch = wwwAuth.match(/token="?([^"\s]+)"?/i);

  if (!addressMatch) return null;

  const network = resolveNetwork(chainIdMatch?.[1] ?? "");
  const tokenAddress = tokenMatch?.[1];
  const currency = resolveTokenSymbol(tokenAddress, network, options);

  return {
    url: "",
    amountRaw: amountMatch?.[1] ?? "0",
    amountUsd: parseUsdAmount(amountMatch?.[1] ?? "0"),
    currency,
    tokenAddress,
    network,
    payTo: addressMatch[1]!,
    parseConfidence: "medium",
    raw: { headers: {}, body: "" },
  };
}

function tryParseBody(
  _headers: Headers,
  body: string,
  options?: Pick<PaymentRouterOptions, "resolveToken">,
): DiscoveredPayment | null {
  try {
    const json = JSON.parse(body);

    // V2 format: { x402Version: 2, accepts: [...] }
    if (json.x402Version === 2 && Array.isArray(json.accepts) && json.accepts.length > 0) {
      const first = json.accepts[0];
      const network = resolveNetwork(first.network ?? "");
      const tokenAddress = first.token ?? first.tokenAddress;
      const currency = first.currency ?? resolveTokenSymbol(tokenAddress, network, options);

      return {
        url: "",
        amountRaw: String(first.price ?? first.maxAmountRequired ?? "0"),
        amountUsd: parseUsdAmount(String(first.price ?? first.maxAmountRequired ?? "0")),
        currency,
        tokenAddress,
        network,
        payTo: first.payTo ?? "",
        scheme: first.scheme,
        facilitator: first.facilitator,
        parseConfidence: "high",
        raw: { headers: {}, body: "" },
      };
    }

    // V1 format: { paymentRequirements: [...] }
    if (Array.isArray(json.paymentRequirements) && json.paymentRequirements.length > 0) {
      const first = json.paymentRequirements[0];
      const network = resolveNetwork(first.network ?? "");
      const tokenAddress = first.token ?? first.tokenAddress;
      const currency = first.currency ?? resolveTokenSymbol(tokenAddress, network, options);

      return {
        url: "",
        amountRaw: String(first.maxAmountRequired ?? first.amount ?? "0"),
        amountUsd: parseUsdAmount(String(first.maxAmountRequired ?? first.amount ?? "0")),
        currency,
        tokenAddress,
        network,
        payTo: first.payTo ?? first.receiver ?? "",
        scheme: first.scheme,
        facilitator: first.facilitator,
        parseConfidence: "medium",
        raw: { headers: {}, body: "" },
      };
    }

    // Generic format: { amount, receiver, network, currency }
    if (json.amount !== undefined && (json.receiver || json.payTo)) {
      const network = resolveNetwork(json.network ?? "");
      const tokenAddress = json.token ?? json.tokenAddress;
      const currency = json.currency ?? resolveTokenSymbol(tokenAddress, network, options);

      return {
        url: "",
        amountRaw: String(json.amount),
        amountUsd: parseUsdAmount(String(json.amount)),
        currency,
        tokenAddress,
        network,
        payTo: json.receiver ?? json.payTo ?? "",
        scheme: json.scheme,
        facilitator: json.facilitator,
        parseConfidence: "medium",
        raw: { headers: {}, body: "" },
      };
    }
  } catch {
    // Not valid JSON
  }

  return null;
}

export async function probeEndpoint(
  endpoint: RouteEndpoint,
  options?: PaymentRouterOptions,
): Promise<ProbeResult> {
  const timeout = endpoint.timeout ?? options?.timeout ?? 10_000;
  const start = Date.now();

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(endpoint.url, {
      method: endpoint.method ?? "GET",
      headers: endpoint.headers,
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timer);
    const responseTimeMs = Date.now() - start;

    if (response.status !== 402) {
      return {
        label: endpoint.label,
        url: endpoint.url,
        status: "free",
        responseTimeMs,
      };
    }

    const bodyText = await response.text();
    const rawHeaders = headersToDict(response.headers);

    const parsers = [
      () => tryParsePaymentRequired(response.headers, bodyText, options),
      () => tryParseWWWAuthenticate(response.headers, bodyText, options),
      () => tryParseBody(response.headers, bodyText, options),
      () => options?.parse402?.(response, bodyText) ?? null,
    ];

    let payment: DiscoveredPayment | null = null;
    for (const parser of parsers) {
      payment = parser();
      if (payment) break;
    }

    if (!payment) {
      payment = {
        url: endpoint.url,
        amountRaw: "0",
        amountUsd: 0,
        currency: "UNKNOWN",
        network: "unknown",
        payTo: "",
        parseConfidence: "low",
        raw: { headers: rawHeaders, body: bodyText },
      };
    } else {
      payment.url = endpoint.url;
      payment.raw = { headers: rawHeaders, body: bodyText };
    }

    return {
      label: endpoint.label,
      url: endpoint.url,
      status: "requires-payment",
      payment,
      responseTimeMs,
    };
  } catch (err) {
    return {
      label: endpoint.label,
      url: endpoint.url,
      status: "error",
      error: err instanceof Error ? err.message : String(err),
      responseTimeMs: Date.now() - start,
    };
  }
}

export async function probeAllEndpoints(
  endpoints: RouteEndpoint[],
  options?: PaymentRouterOptions,
): Promise<ProbeResult[]> {
  return Promise.all(endpoints.map((ep) => probeEndpoint(ep, options)));
}
