import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

import { Logo } from "@/components/site/logo";
import { MobileNav } from "@/components/site/mobile-nav";
import { SiteSearch } from "@/components/site/site-search";
import { ThemeSwitch } from "@/components/site/theme-switch";
import { navGroups, searchItems } from "@/content/nav";
import { llmsAlternate } from "@/content/share";
import { headerLinks } from "@/content/site";
import { Button } from "@/registry/aedis/ui/button";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from "@/registry/aedis/ui/navigation-menu";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Aedis UI", template: "%s · Aedis UI" },
  description: "Secure-by-default React components for building AI platforms.",
  // Pages with share metadata repeat it (a page's alternates replace the layout's).
  alternates: { types: llmsAlternate },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // color-scheme.js sets data-theme before React hydrates.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script src="/color-scheme.js" />
      </head>
      <body className="min-h-screen antialiased">
        {/* First stop for the keyboard: past the header and, on docs pages, past the sidebar's hundred links. */}
        <a href="#main" className="focus-ring sr-only z-50 rounded-sm bg-surface px-3 py-2 text-callout font-medium shadow-elevation-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:px-3 focus:py-2">
          Skip to content
        </a>
        <header className="material-regular scroll-edge sticky top-0 z-40">
          <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 md:gap-6 md:px-6">
            <MobileNav groups={[{ title: "Site", items: headerLinks.map((h) => ({ href: h.href, title: h.label })) }, ...navGroups]} />
            <Link href="/" className="focus-ring flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xs text-headline">
              <Logo className="size-6 shrink-0" />
              Aedis UI
            </Link>
            <NavigationMenu className="hidden flex-1 min-[1360px]:flex" align="start">
              <NavigationMenuList>
                {headerLinks.map((h) => (
                  <NavigationMenuItem key={h.href}>
                    <NavigationMenuLink href={h.href} render={<Link href={h.href} />} className="whitespace-nowrap px-2">{h.label}</NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
            <div className="ml-auto flex items-center gap-2">
              <SiteSearch items={searchItems} />
              <Button variant="ghost" size="icon" aria-label="GitHub (external site)" render={<a href="https://github.com/aedis-build/aedis-ui" rel="noopener noreferrer" />}>
                <svg viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">
                  <path d="M8 0a8 8 0 0 0-2.53 15.59c.4.07.55-.17.55-.38v-1.33c-2.23.48-2.7-1.07-2.7-1.07-.36-.92-.89-1.17-.89-1.17-.73-.5.06-.49.06-.49.8.06 1.23.83 1.23.83.72 1.22 1.87.87 2.33.67.07-.52.28-.87.5-1.07-1.78-.2-3.65-.89-3.65-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.66 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 0 0 8 0z" />
                </svg>
              </Button>
              <ThemeSwitch />
              <Button size="sm" className="hidden sm:inline-flex" render={<Link href="/docs" />}>Get started</Button>
            </div>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
