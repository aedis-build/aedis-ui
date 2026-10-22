import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

import { DocsNav, type NavGroup } from "@/components/site/docs-nav";
import { MobileNav } from "@/components/site/mobile-nav";
import { SiteSearch } from "@/components/site/site-search";
import { ThemeSwitch } from "@/components/site/theme-switch";
import { categories, components, guides } from "@/content/components";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from "@/registry/aedis/ui/navigation-menu";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Aedis UI", template: "%s · Aedis UI" },
  description: "Secure-by-default React components for building AI platforms.",
};

const entries = [
  ...guides,
  ...[...components].sort((a, b) => a.title.localeCompare(b.title)).map((c) => ({ href: `/docs/${c.name}`, title: c.title, description: c.description, category: c.category })),
];

const groups: NavGroup[] = categories
  .map((title) => ({ title, items: entries.filter((e) => e.category === title).map(({ href, title }) => ({ href, title })) }))
  .filter((g) => g.items.length > 0);

// The search index, built with the page: every guide and component, grouped like the sidebar.
const searchItems = groups.flatMap((g) => g.items.map((i) => ({ value: i.href, label: i.title, group: g.title, description: entries.find((e) => e.href === i.href)?.description })));

const header: { href: string; label: string }[] = [
  { href: "/docs", label: "Docs" },
  { href: "/docs/button", label: "Components" },
  { href: "/themes", label: "Themes" },
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // color-scheme.js sets data-theme before React hydrates.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script src="/color-scheme.js" />
      </head>
      <body className="min-h-screen antialiased">
        <header className="material-regular scroll-edge sticky top-0 z-40">
          <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 md:gap-6 md:px-6">
            <MobileNav groups={groups} />
            <Link href="/" className="focus-ring rounded-xs text-headline">Aedis UI</Link>
            <NavigationMenu className="hidden flex-1 md:flex" align="start">
              <NavigationMenuList>
                {header.map((h) => (
                  <NavigationMenuItem key={h.href}>
                    <NavigationMenuLink href={h.href} render={<Link href={h.href} />}>{h.label}</NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
            <div className="ml-auto flex items-center gap-2">
              <SiteSearch items={searchItems} />
              <NavigationMenu align="end" className="hidden md:flex">
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuLink href="https://github.com/aedis-build/aedis-ui">GitHub</NavigationMenuLink>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
              <ThemeSwitch />
            </div>
          </div>
        </header>
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-8 md:grid-cols-[220px_1fr] md:px-6">
          <aside className="hidden md:block">
            <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto scroll-fade-y pb-8">
              <DocsNav groups={groups} />
            </div>
          </aside>
          <main className="min-w-0">{children}</main>
        </div>
      </body>
    </html>
  );
}
