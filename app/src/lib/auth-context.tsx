"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { SentinelAPI, type Team } from "./api";

interface AuthState {
  api: SentinelAPI;
  team: Team;
  isLoading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

function isPublicRoute(pathname: string) {
  return (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/proxy" ||
    pathname.startsWith("/explorer") ||
    pathname.startsWith("/docs") ||
    pathname.startsWith("/auth/")
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [team, setTeam] = useState<Team | null>(null);
  const [api, setApi] = useState<SentinelAPI | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const client = new SentinelAPI();

    client
      .validate()
      .then((t) => {
        setTeam(t);
        setApi(client);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
        if (!isPublicRoute(pathname)) router.push("/login");
      });
  }, [pathname, router]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      // best-effort
    }
    setTeam(null);
    setApi(null);
    router.push("/login");
  }, [router]);

  const value = useMemo(() => {
    if (!api || !team) return null;
    return { api, team, isLoading, logout };
  }, [api, team, isLoading, logout]);

  if (isLoading && !isPublicRoute(pathname)) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="animate-pulse text-[#71717A]">Loading...</div>
      </div>
    );
  }

  if (!value && !isPublicRoute(pathname)) {
    return null;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider on a protected page");
  return ctx;
}
