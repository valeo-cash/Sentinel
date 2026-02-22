"use client";

import { useEffect, useState, useRef, type ReactNode } from "react";
import Link from "next/link";

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
          ? "bg-[#201e1f]/95 backdrop-blur-md border-b border-[#3a3533]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="font-mono text-xs font-medium text-[#f5f0eb] tracking-[0.2em] uppercase"
        >
          SENTINEL
        </Link>
        <div className="flex items-center gap-6 font-mono text-xs tracking-wide">
          <Link
            href="/docs"
            className="text-[#a09a94] hover:text-[#f5f0eb] transition-colors"
          >
            Docs
          </Link>
          <a
            href="https://github.com/valeo-cash/Sentinel"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#a09a94] hover:text-[#f5f0eb] transition-colors"
          >
            GitHub
          </a>
          <Link
            href="/login"
            className="text-[#F59E0B] hover:text-amber-400 transition-colors"
          >
            Dashboard &rarr;
          </Link>
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
