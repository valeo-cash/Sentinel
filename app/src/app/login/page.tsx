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

// --- Wallet SVG icons ---

function PhantomIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 128 128" fill="currentColor" className="opacity-90">
      <path d="M110.6 46.3H107V37.6C107 22 94.4 9.4 78.8 9.4H37.6C22 9.4 9.4 22 9.4 37.6V90.4C9.4 106 22 118.6 37.6 118.6H90.4C106 118.6 118.6 106 118.6 90.4V54.3C118.6 49.9 115 46.3 110.6 46.3ZM98 80.4C94.2 80.4 91 77.2 91 73.4C91 69.6 94.2 66.4 98 66.4C101.8 66.4 105 69.6 105 73.4C105 77.2 101.8 80.4 98 80.4ZM98 46.3H37.6C30.2 46.3 24.2 40.3 24.2 32.9C24.2 25.5 30.2 19.5 37.6 19.5H78.8C89.3 19.5 97.8 28 97.8 38.5V46.3H98Z"/>
    </svg>
  );
}

function MetaMaskIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 35 33" fill="none" className="opacity-90">
      <path d="M32.96 1l-13.14 9.72 2.45-5.73L32.96 1z" fill="#E8831D" stroke="#E8831D" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2.66 1l13.02 9.81L13.35 4.99 2.66 1zm25.57 22.53l-3.5 5.34 7.49 2.06 2.14-7.28-6.13-.12zm-24.33.12l2.13 7.28 7.47-2.06-3.48-5.34-6.12.12z" fill="#E8831D" stroke="#E8831D" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13.25 14.51l-2.08 3.14 7.4.34-.26-7.96-5.06 4.48zm9.12 0l-5.16-4.58-.17 8.06 7.4-.34-2.07-3.14zm-9.05 13.12l4.44-2.16-3.83-2.99-.61 5.15zm8.91-2.16l4.48 2.16-.65-5.15-3.83 2.99z" fill="#E8831D" stroke="#E8831D" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M26.71 27.63l-4.48-2.16.36 2.93-.04 1.23 4.16-1.99zm-18.8 0l4.16 2 -.04-1.24.36-2.93-4.48 2.16z" fill="#D5BFB2" stroke="#D5BFB2" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12.15 21.23l-3.67-1.08 2.6-1.19 1.07 2.27zm11.32 0l1.07-2.27 2.6 1.19-3.67 1.08z" fill="#233447" stroke="#233447" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7.91 27.63l.65-5.34-4.13.12 3.48 5.22zm19.15-5.34l.65 5.34 3.48-5.22-4.13-.12zm4.56-4.62l-7.4.34.69 3.82 1.07-2.27 2.6 1.19 3.04-3.08zM8.48 21.23l2.6-1.19 1.07 2.27.69-3.82-7.4-.34 3.04 3.08z" fill="#CC6228" stroke="#CC6228" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5.44 17.67l3.16 6.17-.1-3.08-3.06-3.09zm20.74 3.09l-.11 3.08 3.16-6.17-3.05 3.09zm-13.34-2.75l-.69 3.82.87 4.48.2-5.9-.38-2.4zm5.94 0l-.37 2.39.17 5.91.87-4.48-.67-3.82z" fill="#E8831D" stroke="#E8831D" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function CoinbaseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 28 28" fill="none" className="opacity-90">
      <rect width="28" height="28" rx="14" fill="#0052FF"/>
      <path d="M14 6a8 8 0 100 16 8 8 0 000-16zm-2.4 10.4a3.4 3.4 0 010-4.8l1.13 1.13a1.8 1.8 0 000 2.54L11.6 16.4zm4.8 0l-1.13-1.13a1.8 1.8 0 000-2.54L16.4 11.6a3.4 3.4 0 010 4.8z" fill="white"/>
    </svg>
  );
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
                <PhantomIcon />
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
                <MetaMaskIcon />
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
                <CoinbaseIcon />
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
