"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Shield, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";

export default function ClaimPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="animate-pulse text-muted">Loading...</div>
        </div>
      }
    >
      <ClaimForm />
    </Suspense>
  );
}

interface MigratedData {
  payments: number;
  agents: number;
  receipts: number;
}

function ClaimForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [token, setToken] = useState(searchParams.get("token") || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [migrated, setMigrated] = useState<MigratedData | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("sentinel_claim_token");
    if (stored && !token) {
      setToken(stored);
      sessionStorage.removeItem("sentinel_claim_token");
    }
  }, [token]);

  async function handleClaim() {
    if (!token.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/v1/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ claimToken: token.trim() }),
      });

      if (res.status === 401) {
        sessionStorage.setItem("sentinel_claim_token", token.trim());
        router.push(`/login?claim=${encodeURIComponent(token.trim())}`);
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to claim data");
      }

      setMigrated(data.migrated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (migrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm">
          <div className="rounded-xl border border-border bg-card p-6 sm:p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <h1 className="text-lg font-semibold text-foreground mb-2">
              Data claimed successfully
            </h1>
            <p className="text-sm text-muted mb-6">
              Migrated {migrated.payments.toLocaleString()} payments,{" "}
              {migrated.agents.toLocaleString()} agents, and{" "}
              {migrated.receipts.toLocaleString()} receipts to your account.
            </p>
            <Link
              href="/dashboard/explorer"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-accent text-[#191919] font-semibold rounded-lg hover:bg-white transition-colors text-sm"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
          <div className="flex justify-center mb-4">
            <Image src="/sentinel_logo.png" alt="Sentinel" width={48} height={48} />
          </div>
          <h1 className="text-lg font-semibold text-foreground text-center mb-1">
            Claim your agent data
          </h1>
          <p className="text-sm text-muted text-center mb-6">
            Enter your claim token to migrate anonymous agent data to your account.
          </p>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-4">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-muted mb-1.5">Claim Token</label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ct_..."
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground font-mono text-sm placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <button
              onClick={handleClaim}
              disabled={loading || !token.trim()}
              className="w-full py-2.5 bg-accent text-[#191919] font-semibold rounded-lg hover:bg-white transition-colors disabled:opacity-50 text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                "Claiming..."
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Claim Data
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
