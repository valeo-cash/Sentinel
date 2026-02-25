"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Shield, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="animate-pulse text-muted">Loading...</div>
        </div>
      }
    >
      <RegisterFlow />
    </Suspense>
  );
}

interface MigratedData {
  payments: number;
  receipts: number;
  agents: number;
}

function RegisterFlow() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [agentId, setAgentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [migrated, setMigrated] = useState<MigratedData | null>(null);
  const [registered, setRegistered] = useState(false);

  const registerAgent = useCallback(async (id: string) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/v1/agents/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ agentId: id }),
      });

      if (res.status === 401) {
        sessionStorage.setItem("sentinel_register_agent", id);
        router.push(`/login?agent=${encodeURIComponent(id)}`);
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to register agent");
      }

      setRegistered(true);
      if (data.migrated) setMigrated(data.migrated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const paramAgent = searchParams.get("agent");
    const storedAgent = sessionStorage.getItem("sentinel_register_agent");
    const id = paramAgent || storedAgent;

    if (storedAgent) sessionStorage.removeItem("sentinel_register_agent");

    if (!id) {
      setError("No agent ID provided. Use /register?agent=your-agent-id");
      setLoading(false);
      return;
    }

    setAgentId(id);
    registerAgent(id);
  }, [searchParams, registerAgent]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted">Registering agent...</div>
      </div>
    );
  }

  if (registered && agentId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm">
          <div className="rounded-xl border border-border bg-card p-6 sm:p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <h1 className="text-lg font-semibold text-foreground mb-2">
              Agent registered!
            </h1>
            <p className="text-sm text-muted mb-1">
              <span className="font-mono text-foreground">{agentId}</span> is now linked to your account.
            </p>
            {migrated && (migrated.payments > 0 || migrated.agents > 0 || migrated.receipts > 0) && (
              <p className="text-sm text-muted mb-4">
                Migrated {migrated.payments.toLocaleString()} payments,{" "}
                {migrated.agents.toLocaleString()} agents, and{" "}
                {migrated.receipts.toLocaleString()} receipts to your account.
              </p>
            )}
            <div className="mt-6">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-border bg-card p-6 sm:p-8 text-center">
          <div className="flex justify-center mb-4">
            <Image src="/sentinel_logo.png" alt="Sentinel" width={48} height={48} />
          </div>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-4">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-400 text-left">{error}</p>
          </div>
          <Link
            href="/"
            className="text-sm text-accent hover:text-white transition-colors"
          >
            Go to Sentinel
          </Link>
        </div>
      </div>
    </div>
  );
}
