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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [team, setTeam] = useState<Team | null>(null);
  const [api, setApi] = useState<SentinelAPI | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const key = localStorage.getItem("sentinel_api_key");
    if (!key) {
      setIsLoading(false);
      if (pathname !== "/login") router.push("/login");
      return;
    }
    const client = new SentinelAPI(key);
    client
      .validate()
      .then((t) => {
        setTeam(t);
        setApi(client);
        setIsLoading(false);
      })
      .catch(() => {
        localStorage.removeItem("sentinel_api_key");
        setIsLoading(false);
        router.push("/login");
      });
  }, [pathname, router]);

  const logout = useCallback(() => {
    localStorage.removeItem("sentinel_api_key");
    setTeam(null);
    setApi(null);
    router.push("/login");
  }, [router]);

  const value = useMemo(() => {
    if (!api || !team) return null;
    return { api, team, isLoading, logout };
  }, [api, team, isLoading, logout]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="animate-pulse text-[#71717A]">Loading...</div>
      </div>
    );
  }

  if (!value && pathname !== "/login") {
    return null;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider on a protected page");
  return ctx;
}
