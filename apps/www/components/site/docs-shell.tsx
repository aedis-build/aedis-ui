import type { ReactNode } from "react";

import { DocsNav } from "@/components/site/docs-nav";
import { navGroups } from "@/content/nav";

/** Docs pages: the category sidebar next to the content. The home page is full width. */
export function DocsShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-8 md:grid-cols-[220px_1fr] md:px-6">
      <aside className="hidden md:block">
        <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto scroll-fade-y pb-8">
          <DocsNav groups={navGroups} />
        </div>
      </aside>
      <main className="min-w-0">{children}</main>
    </div>
  );
}
