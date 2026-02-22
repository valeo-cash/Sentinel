import { DocsPage, DocsBody, DocsTitle, DocsDescription } from "fumadocs-ui/page";
import type { ReactNode } from "react";
import { CodeBlockEnhancer } from "./code-block-enhancer";

interface DocPageProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function DocPage({ title, description, children }: DocPageProps) {
  return (
    <DocsPage>
      <DocsTitle>{title}</DocsTitle>
      {description && <DocsDescription>{description}</DocsDescription>}
      <DocsBody>
        <div className="docs-content">
          {children}
          <CodeBlockEnhancer />
        </div>
      </DocsBody>
    </DocsPage>
  );
}
