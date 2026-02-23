"use client";

import { Suspense, useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Mail, Wallet, ArrowLeft, ExternalLink } from "lucide-react";

type Tab = "email" | "wallet";

// --- Wallet detection helpers ---

interface PhantomSolana {
  isPhantom?: boolean;
  connect: () => Promise<{ publicKey: { toString: () => string } }>;
  signMessage: (msg: Uint8Array, encoding: string) => Promise<{ signature: Uint8Array }>;
}

interface EthereumProvider {
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
  providers?: EthereumProvider[];
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

function getPhantom(): PhantomSolana | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const phantom = (window as any)?.phantom;
  const solana = phantom?.solana as PhantomSolana | undefined;
  return solana?.isPhantom ? solana : null;
}

function getMetaMask(): EthereumProvider | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eth = (window as any)?.ethereum as EthereumProvider | undefined;
  if (!eth) return null;
  if (eth.providers) {
    const mm = eth.providers.find((p) => p.isMetaMask && !p.isCoinbaseWallet);
    if (mm) return mm;
  }
  return eth.isMetaMask && !eth.isCoinbaseWallet ? eth : null;
}

function getCoinbaseWallet(): EthereumProvider | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cbExt = (window as any)?.coinbaseWalletExtension as EthereumProvider | undefined;
  if (cbExt) return cbExt;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eth = (window as any)?.ethereum as EthereumProvider | undefined;
  if (!eth) return null;
  if (eth.providers) {
    const cb = eth.providers.find((p) => p.isCoinbaseWallet);
    if (cb) return cb;
  }
  return eth.isCoinbaseWallet ? eth : null;
}

// --- Wallet icons (served from /public) ---

function WalletIcon({ src, alt }: { src: string; alt: string }) {
  return <img src={src} alt={alt} width={20} height={20} className="rounded-sm" />;
}

// --- Components ---

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

function CodeInput({ onComplete, disabled }: { onComplete: (code: string) => void; disabled: boolean }) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = useCallback((index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (next.every((d) => d.length === 1)) {
      onComplete(next.join(""));
    }
  }, [digits, onComplete]);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }, [digits]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...digits];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i]!;
    setDigits(next);
    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();
    if (next.every((d) => d.length === 1)) {
      onComplete(next.join(""));
    }
  }, [digits, onComplete]);

  return (
    <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          disabled={disabled}
          className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-mono font-bold bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-accent transition-colors disabled:opacity-50"
        />
      ))}
    </div>
  );
}

function LoginForm() {
  const [tab, setTab] = useState<Tab>("email");
  const [email, setEmail] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingWallet, setLoadingWallet] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();

  const tokenError = searchParams.get("error");

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  async function sendCode() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || "Failed to send code");
      }
      setCodeSent(true);
      setResendCooldown(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    await sendCode();
  }

  async function handleCodeComplete(code: string) {
    setVerifying(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json().catch(() => ({})) as { ok?: boolean; error?: string; redirect?: string };
      if (!res.ok) {
        throw new Error(data.error || "Invalid code");
      }
      router.push(data.redirect || "/dashboard/explorer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
      setVerifying(false);
    }
  }

  async function submitWalletAuth(publicKey: string, signature: string, message: string, walletType: "solana" | "evm") {
    const res = await fetch("/api/auth/wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicKey, signature, message, walletType }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error((data as { error?: string }).error || "Wallet authentication failed");
    }
    router.push("/dashboard/explorer");
  }

  function buildSignMessage(address: string): string {
    const nonce = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    return `Sign in to Sentinel\nWallet: ${address}\nTimestamp: ${timestamp}\nNonce: ${nonce}`;
  }

  async function handlePhantomLogin() {
    const phantom = getPhantom();
    if (!phantom) {
      window.open("https://phantom.app/", "_blank");
      return;
    }

    setLoadingWallet("phantom");
    setError("");
    try {
      const resp = await phantom.connect();
      const publicKey = resp.publicKey.toString();
      const message = buildSignMessage(publicKey);

      const encodedMessage = new TextEncoder().encode(message);
      const signedMessage = await phantom.signMessage(encodedMessage, "utf8");
      const signatureBase64 = btoa(String.fromCharCode(...signedMessage.signature));

      await submitWalletAuth(publicKey, signatureBase64, message, "solana");
    } catch (err) {
      if (err instanceof Error && err.message.includes("User rejected")) {
        setError("Signature request was cancelled");
      } else {
        setError(err instanceof Error ? err.message : "Wallet login failed");
      }
    } finally {
      setLoadingWallet(null);
    }
  }

  async function handleEvmLogin(provider: EthereumProvider, walletName: string) {
    setLoadingWallet(walletName);
    setError("");
    try {
      const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
      const address = accounts[0];
      if (!address) throw new Error("No account selected");

      const message = buildSignMessage(address);
      const signature = (await provider.request({
        method: "personal_sign",
        params: [message, address],
      })) as string;

      await submitWalletAuth(address, signature, message, "evm");
    } catch (err) {
      if (err instanceof Error && (err.message.includes("User rejected") || err.message.includes("user rejected"))) {
        setError("Signature request was cancelled");
      } else {
        setError(err instanceof Error ? err.message : "Wallet login failed");
      }
    } finally {
      setLoadingWallet(null);
    }
  }

  const isWalletLoading = loadingWallet !== null;

  const hasPhantom = typeof window !== "undefined" && !!getPhantom();
  const hasMetaMask = typeof window !== "undefined" && !!getMetaMask();
  const hasCoinbase = typeof window !== "undefined" && !!getCoinbaseWallet();
  const hasAnyWallet = hasPhantom || hasMetaMask || hasCoinbase;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
          <div className="flex justify-center mb-4">
            <Image src="/sentinel_logo.png" alt="Sentinel" width={48} height={48} />
          </div>
          <p className="text-sm text-muted mb-6 text-center">Sign in to access the agent dashboard.</p>

          {/* Tab Toggle */}
          <div className="flex rounded-lg border border-border bg-background p-1 mb-6">
            <button
              onClick={() => { setTab("email"); setError(""); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                tab === "email"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
            <button
              onClick={() => { setTab("wallet"); setError(""); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                tab === "wallet"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <Wallet className="w-4 h-4" />
              Wallet
            </button>
          </div>

          {/* Error Messages */}
          {tokenError === "invalid_token" && (
            <p className="text-sm text-danger mb-4">Code is invalid or expired. Please try again.</p>
          )}
          {error && <p className="text-sm text-danger mb-4">{error}</p>}

          {/* Email Tab */}
          {tab === "email" && (
            codeSent ? (
              <div className="text-center py-4 space-y-5">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
                  <Mail className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-foreground font-medium mb-1">Enter verification code</p>
                  <p className="text-xs text-muted">
                    We sent a 6-digit code to <span className="text-foreground">{email}</span>
                  </p>
                </div>
                <CodeInput onComplete={handleCodeComplete} disabled={verifying} />
                {verifying && (
                  <p className="text-xs text-muted animate-pulse">Verifying...</p>
                )}
                <div className="flex items-center justify-center gap-3 pt-1">
                  <button
                    onClick={() => { setCodeSent(false); setError(""); }}
                    className="text-xs text-muted hover:text-foreground transition-colors"
                  >
                    Change email
                  </button>
                  <span className="text-border">|</span>
                  <button
                    onClick={sendCode}
                    disabled={resendCooldown > 0 || loading}
                    className="text-xs text-accent hover:text-white transition-colors disabled:text-muted disabled:cursor-not-allowed"
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-muted mb-1.5">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors text-sm"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full py-2.5 bg-accent text-[#191919] font-semibold rounded-lg hover:bg-white transition-colors disabled:opacity-50 text-sm"
                >
                  {loading ? "Sending..." : "Send Verification Code"}
                </button>
              </form>
            )
          )}

          {/* Wallet Tab */}
          {tab === "wallet" && (
            <div className="space-y-2.5">
              {/* Phantom */}
              <button
                onClick={handlePhantomLogin}
                disabled={isWalletLoading}
                className="w-full py-2.5 bg-[#AB9FF2] text-white font-semibold rounded-lg hover:bg-[#9B8FE2] transition-colors disabled:opacity-50 flex items-center justify-center gap-2.5 text-sm"
              >
                <WalletIcon src="/phantom-logo.svg" alt="Phantom" />
                {loadingWallet === "phantom" ? "Connecting..." : "Phantom"}
                {!hasPhantom && <span className="text-white/60 text-xs ml-1">(install)</span>}
              </button>

              {/* MetaMask */}
              <button
                onClick={() => {
                  const mm = getMetaMask();
                  if (!mm) { window.open("https://metamask.io/download/", "_blank"); return; }
                  handleEvmLogin(mm, "metamask");
                }}
                disabled={isWalletLoading}
                className="w-full py-2.5 bg-[#E8831D] text-white font-semibold rounded-lg hover:bg-[#D5751A] transition-colors disabled:opacity-50 flex items-center justify-center gap-2.5 text-sm"
              >
                <WalletIcon src="/metamask-logo.png" alt="MetaMask" />
                {loadingWallet === "metamask" ? "Connecting..." : "MetaMask"}
                {!hasMetaMask && <span className="text-white/60 text-xs ml-1">(install)</span>}
              </button>

              {/* Coinbase Wallet */}
              <button
                onClick={() => {
                  const cb = getCoinbaseWallet();
                  if (!cb) { window.open("https://www.coinbase.com/wallet/downloads", "_blank"); return; }
                  handleEvmLogin(cb, "coinbase");
                }}
                disabled={isWalletLoading}
                className="w-full py-2.5 bg-[#0052FF] text-white font-semibold rounded-lg hover:bg-[#0047E0] transition-colors disabled:opacity-50 flex items-center justify-center gap-2.5 text-sm"
              >
                <WalletIcon src="/coinbase-logo.svg" alt="Coinbase Wallet" />
                {loadingWallet === "coinbase" ? "Connecting..." : "Coinbase Wallet"}
                {!hasCoinbase && <span className="text-white/60 text-xs ml-1">(install)</span>}
              </button>

              <p className="text-xs text-muted text-center pt-1">
                One-time signature to verify ownership. No gas fees.
              </p>

              {!hasAnyWallet && typeof window !== "undefined" && (
                <div className="flex items-center justify-center gap-3 pt-1">
                  <a href="https://phantom.app/" target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:text-white transition-colors inline-flex items-center gap-1">
                    Phantom <ExternalLink className="w-3 h-3" />
                  </a>
                  <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:text-white transition-colors inline-flex items-center gap-1">
                    MetaMask <ExternalLink className="w-3 h-3" />
                  </a>
                  <a href="https://www.coinbase.com/wallet/downloads" target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:text-white transition-colors inline-flex items-center gap-1">
                    Coinbase <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        <Link
          href="/"
          className="flex items-center justify-center gap-1.5 mt-6 text-xs text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to home
        </Link>
      </div>
    </div>
  );
}
