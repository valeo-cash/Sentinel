"use client";

import { useEffect, useState, useRef, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  BookOpen,
  Github,
  Package,
  LayoutDashboard,
  Globe,
  Play,
} from "lucide-react";

const iconLinks = [
  { icon: Globe, label: "Explorer", href: "/explorer", external: false },
  { icon: Play, label: "Playground", href: "/playground", external: false },
  { icon: BookOpen, label: "Docs", href: "/docs", external: false },
  { icon: Github, label: "GitHub", href: "https://github.com/valeo-cash/Sentinel", external: true },
  { icon: Package, label: "npm", href: "https://www.npmjs.com/package/@x402sentinel/x402", external: true },
  { icon: LayoutDashboard, label: "Dashboard", href: "/login", external: false },
] as const;

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/90 backdrop-blur-md border-b border-border"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/sentinel_logo.png" alt="Sentinel" width={28} height={28} />
          <span className="text-sm font-bold text-accent tracking-wide">SENTINEL</span>
        </Link>
        <div className="flex items-center gap-2">
          {iconLinks.map(({ icon: Icon, label, href, external }) => {
            const cls =
              "group relative flex items-center justify-center w-9 h-9 rounded-lg border border-border hover:border-accent/50 hover:bg-card transition-all duration-200";
            const inner = (
              <>
                <Icon className="w-4 h-4 text-muted group-hover:text-accent transition-colors" />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[10px] bg-card border border-border text-muted opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {label}
                </span>
              </>
            );
            return external ? (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" className={cls}>
                {inner}
              </a>
            ) : (
              <Link key={label} href={href} className={cls}>
                {inner}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export function FadeIn({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      } ${className}`}
    >
      {children}
    </div>
  );
}
