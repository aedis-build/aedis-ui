import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

import { components } from "@/content/components";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Aedis UI", template: "%s · Aedis UI" },
  description: "Secure-by-default React components for building AI platforms.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <header className="border-b border-border">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
            <Link href="/" className="font-semibold">Aedis UI</Link>
            <nav className="flex gap-4 text-sm text-muted-foreground">
              <Link href="/docs/button" className="hover:text-foreground">Components</Link>
              <a href="https://github.com/aedis-build/aedis-ui" rel="noopener noreferrer" className="hover:text-foreground">GitHub</a>
            </nav>
          </div>
        </header>
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:grid-cols-[200px_1fr]">
          <aside className="hidden md:block">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Getting started</p>
            <ul className="mb-6 space-y-1 text-sm">
              <li><Link href="/docs/theming" className="text-muted-foreground hover:text-foreground">Theming</Link></li>
            </ul>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Components</p>
            <ul className="space-y-1 text-sm">
              {components.map((c) => (
                <li key={c.name}>
                  <Link href={`/docs/${c.name}`} className="text-muted-foreground hover:text-foreground">{c.title}</Link>
                </li>
              ))}
            </ul>
          </aside>
          <main className="min-w-0">{children}</main>
        </div>
      </body>
    </html>
  );
}
