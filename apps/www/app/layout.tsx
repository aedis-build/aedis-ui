import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

import { MobileNav } from "@/components/site/mobile-nav";
import { SiteSearch } from "@/components/site/site-search";
import { ThemeSwitch } from "@/components/site/theme-switch";
import { navGroups, searchItems } from "@/content/nav";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from "@/registry/aedis/ui/navigation-menu";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Aedis UI", template: "%s · Aedis UI" },
  description: "Secure-by-default React components for building AI platforms.",
};

const header: { href: string; label: string }[] = [
  { href: "/docs", label: "Docs" },
  { href: "/#components", label: "Components" },
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
            <MobileNav groups={navGroups} />
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
        {children}
      </body>
    </html>
  );
}
