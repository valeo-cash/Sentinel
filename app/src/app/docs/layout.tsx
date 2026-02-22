import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import Image from "next/image";
import { pageTree } from "@/lib/docs-source";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={pageTree}
      nav={{
        title: (
          <span className="flex items-center gap-2 font-bold">
            <Image src="/sentinel_logo.png" alt="Sentinel" width={22} height={22} />
            <span className="text-amber-500">SENTINEL</span>{" "}
            <span className="text-xs text-zinc-500">Docs</span>
          </span>
        ),
      }}
      themeSwitch={{ enabled: false }}
      links={[
        { text: "Dashboard", url: "/dashboard" },
        {
          text: "GitHub",
          url: "https://github.com/valeo-money/sentinel",
          external: true,
        },
      ]}
    >
      {children}
    </DocsLayout>
  );
}
