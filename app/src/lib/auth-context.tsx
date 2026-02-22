"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from "react";
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
  const [authFailed, setAuthFailed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const didValidate = useRef(false);

  useEffect(() => {
    if (didValidate.current) return;
    didValidate.current = true;

    const client = new SentinelAPI();

    client
      .validate()
      .then((t) => {
        setTeam(t);
        setApi(client);
        setIsLoading(false);
      })
      .catch(() => {
        setAuthFailed(true);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (authFailed && !isPublicRoute(pathname)) {
      router.push("/login");
    }
  }, [isLoading, authFailed, pathname, router]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      // best-effort
    }
    setTeam(null);
    setApi(null);
    setAuthFailed(true);
    router.push("/login");
  }, [router]);

  const value = useMemo(() => {
    if (!api || !team) return null;
    return { api, team, isLoading, logout };
  }, [api, team, isLoading, logout]);

  if (isLoading && !isPublicRoute(pathname)) {
    return (
      <div className="min-h-screen bg-[#191919] flex items-center justify-center">
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

export function useOptionalAuth() {
  return useContext(AuthContext);
}
