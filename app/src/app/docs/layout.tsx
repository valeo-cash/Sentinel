import "fumadocs-ui/style.css";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import { pageTree } from "@/lib/docs-source";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={pageTree}
      nav={{
        title: (
          <span className="font-bold">
            <span className="text-amber-500">SENTINEL</span>{" "}
            <span className="text-xs text-zinc-500">Docs</span>
          </span>
        ),
      }}
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
