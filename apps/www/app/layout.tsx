import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

import { MobileNav } from "@/components/site/mobile-nav";
import { components } from "@/content/components";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from "@/registry/aedis/ui/navigation-menu";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Aedis UI", template: "%s · Aedis UI" },
  description: "Secure-by-default React components for building AI platforms.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <header className="material-regular scroll-edge sticky top-0 z-40">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <MobileNav items={components.map((c) => ({ name: c.name, title: c.title }))} />
              <Link href="/" className="focus-ring rounded-xs text-headline">Aedis UI</Link>
            </div>
            <NavigationMenu align="end">
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink href="/docs/button" render={<Link href="/docs/button" />}>Components</NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink href="/themes" render={<Link href="/themes" />}>Themes</NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink href="https://github.com/aedis-build/aedis-ui">GitHub</NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </header>
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:grid-cols-[200px_1fr]">
          <aside className="hidden md:block">
            <p className="mb-2 text-caption uppercase text-muted-foreground">Getting started</p>
            <ul className="mb-6 space-y-1 text-callout">
              <li><Link href="/docs/theming" className="focus-ring rounded-xs text-muted-foreground transition-colors duration-(--duration-fast) ease-out hover:text-foreground">Theming</Link></li>
              <li><Link href="/themes" className="focus-ring rounded-xs text-muted-foreground transition-colors duration-(--duration-fast) ease-out hover:text-foreground">Themes</Link></li>
              <li><Link href="/docs/server-actions" className="focus-ring rounded-xs text-muted-foreground transition-colors duration-(--duration-fast) ease-out hover:text-foreground">Server Actions</Link></li>
              <li><Link href="/docs/micro-frontends" className="focus-ring rounded-xs text-muted-foreground transition-colors duration-(--duration-fast) ease-out hover:text-foreground">Micro-frontends</Link></li>
            </ul>
            <p className="mb-2 text-caption uppercase text-muted-foreground">Components</p>
            <ul className="space-y-1 text-callout">
              {components.map((c) => (
                <li key={c.name}>
                  <Link href={`/docs/${c.name}`} className="focus-ring rounded-xs text-muted-foreground transition-colors duration-(--duration-fast) ease-out hover:text-foreground">{c.title}</Link>
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
