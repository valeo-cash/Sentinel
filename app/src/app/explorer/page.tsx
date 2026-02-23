"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ExplorerContent } from "@/components/explorer/explorer-content";
import { useOptionalAuth } from "@/lib/auth-context";

export default function PublicExplorerPage() {
  const auth = useOptionalAuth();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (auth) {
      router.replace("/dashboard/explorer");
    } else {
      setChecked(true);
    }
  }, [auth, router]);

  if (!checked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-muted border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image src="/sentinel_logo.png" alt="Sentinel" width={24} height={24} />
            <span className="text-sm font-semibold text-accent tracking-wider">SENTINEL</span>
          </Link>
          <span className="text-muted text-sm hidden sm:inline">/</span>
          <span className="text-sm font-medium text-white hidden sm:inline">Explorer</span>
          <div className="flex-1" />
          <Link href="/login" className="text-xs text-muted hover:text-white transition-colors shrink-0">
            Sign In
          </Link>
          <Link href="/docs" className="text-xs text-muted hover:text-white transition-colors shrink-0">
            Docs
          </Link>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <ExplorerContent basePath="/explorer" />
      </main>
    </div>
  );
}
