"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Wallet, ArrowLeft, ExternalLink } from "lucide-react";

type Tab = "email" | "wallet";

interface PhantomSolana {
  isPhantom?: boolean;
  connect: () => Promise<{ publicKey: { toString: () => string } }>;
  signMessage: (msg: Uint8Array, encoding: string) => Promise<{ signature: Uint8Array }>;
}

function getPhantom(): PhantomSolana | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const phantom = (window as any)?.phantom;
  const solana = phantom?.solana as PhantomSolana | undefined;
  return solana?.isPhantom ? solana : null;
}

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

function LoginForm() {
  const [tab, setTab] = useState<Tab>("email");
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  const tokenError = searchParams.get("error");

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
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
        throw new Error((data as { error?: string }).error || "Failed to send magic link");
      }
      setEmailSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleWalletLogin() {
    const phantom = getPhantom();
    if (!phantom) {
      window.open("https://phantom.app/", "_blank");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const resp = await phantom.connect();
      const publicKey = resp.publicKey.toString();

      const nonce = crypto.randomUUID();
      const timestamp = new Date().toISOString();
      const message = `Sign in to Sentinel\nWallet: ${publicKey}\nTimestamp: ${timestamp}\nNonce: ${nonce}`;

      const encodedMessage = new TextEncoder().encode(message);
      const signedMessage = await phantom.signMessage(encodedMessage, "utf8");

      const signatureBase64 = btoa(
        String.fromCharCode(...signedMessage.signature)
      );

      const res = await fetch("/api/auth/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicKey, signature: signatureBase64, message }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || "Wallet authentication failed");
      }

      router.push("/dashboard");
    } catch (err) {
      if (err instanceof Error && err.message.includes("User rejected")) {
        setError("Signature request was cancelled");
      } else {
        setError(err instanceof Error ? err.message : "Wallet login failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-border bg-card p-8">
          <h1 className="text-xl font-bold text-accent tracking-wide mb-0.5">SENTINEL</h1>
          <p className="text-sm text-muted mb-6">Sign in to access the agent dashboard.</p>

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
            <p className="text-sm text-danger mb-4">Magic link is invalid or expired. Please try again.</p>
          )}
          {tokenError === "missing_token" && (
            <p className="text-sm text-danger mb-4">Missing verification token.</p>
          )}
          {error && <p className="text-sm text-danger mb-4">{error}</p>}

          {/* Email Tab */}
          {tab === "email" && (
            emailSent ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-6 h-6 text-accent" />
                </div>
                <p className="text-sm text-foreground font-medium mb-1">Check your inbox</p>
                <p className="text-xs text-muted">
                  We sent a sign-in link to <span className="text-foreground">{email}</span>.
                  <br />The link expires in 15 minutes.
                </p>
                <button
                  onClick={() => setEmailSent(false)}
                  className="mt-4 text-xs text-accent hover:text-amber-400 transition-colors"
                >
                  Use a different email
                </button>
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
                  className="w-full py-2.5 bg-accent text-background font-semibold rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-50 text-sm"
                >
                  {loading ? "Sending..." : "Send Magic Link"}
                </button>
              </form>
            )
          )}

          {/* Wallet Tab */}
          {tab === "wallet" && (
            <div className="space-y-4">
              <button
                onClick={handleWalletLogin}
                disabled={loading}
                className="w-full py-2.5 bg-[#AB9FF2] text-white font-semibold rounded-lg hover:bg-[#9B8FE2] transition-colors disabled:opacity-50 flex items-center justify-center gap-2.5 text-sm"
              >
                <svg width="16" height="16" viewBox="0 0 128 128" fill="currentColor" className="opacity-90">
                  <path d="M110.6 46.3H107V37.6C107 22 94.4 9.4 78.8 9.4H37.6C22 9.4 9.4 22 9.4 37.6V90.4C9.4 106 22 118.6 37.6 118.6H90.4C106 118.6 118.6 106 118.6 90.4V54.3C118.6 49.9 115 46.3 110.6 46.3ZM98 80.4C94.2 80.4 91 77.2 91 73.4C91 69.6 94.2 66.4 98 66.4C101.8 66.4 105 69.6 105 73.4C105 77.2 101.8 80.4 98 80.4ZM98 46.3H37.6C30.2 46.3 24.2 40.3 24.2 32.9C24.2 25.5 30.2 19.5 37.6 19.5H78.8C89.3 19.5 97.8 28 97.8 38.5V46.3H98Z"/>
                </svg>
                {loading ? "Connecting..." : "Connect with Phantom"}
              </button>
              <p className="text-xs text-muted text-center">
                One-time signature to verify ownership. No gas fees.
              </p>
              {!getPhantom() && typeof window !== "undefined" && (
                <a
                  href="https://phantom.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 text-xs text-accent hover:text-amber-400 transition-colors"
                >
                  Install Phantom <ExternalLink className="w-3 h-3" />
                </a>
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
