"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { EndpointDetailContent } from "@/components/explorer/endpoint-detail-content";
import { useOptionalAuth } from "@/lib/auth-context";

export default function PublicEndpointDetailPage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain } = use(params);
  const auth = useOptionalAuth();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (auth) {
      router.replace(`/dashboard/explorer/endpoint/${encodeURIComponent(domain)}`);
    } else {
      setChecked(true);
    }
  }, [auth, router, domain]);

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
          <span className="text-muted text-sm">/</span>
          <Link href="/explorer" className="text-sm text-muted hover:text-white transition-colors">
            Explorer
          </Link>
          <span className="text-muted text-sm">/</span>
          <span className="text-sm text-white truncate">{decodeURIComponent(domain)}</span>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <EndpointDetailContent domain={domain} basePath="/explorer" />
      </main>
    </div>
  );
}
