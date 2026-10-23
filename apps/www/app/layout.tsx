import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

import { Logo } from "@/components/site/logo";
import { MobileNav } from "@/components/site/mobile-nav";
import { SiteSearch } from "@/components/site/site-search";
import { ThemeSwitch } from "@/components/site/theme-switch";
import { navGroups, searchItems } from "@/content/nav";
import { headerLinks } from "@/content/site";
import { Button } from "@/registry/aedis/ui/button";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from "@/registry/aedis/ui/navigation-menu";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Aedis UI", template: "%s · Aedis UI" },
  description: "Secure-by-default React components for building AI platforms.",
};

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
            <MobileNav groups={[{ title: "Site", items: headerLinks.map((h) => ({ href: h.href, title: h.label })) }, ...navGroups]} />
            <Link href="/" className="focus-ring flex items-center gap-2 rounded-xs text-headline">
              <Logo className="size-6 shrink-0" />
              Aedis UI
            </Link>
            <NavigationMenu className="hidden flex-1 lg:flex" align="start">
              <NavigationMenuList>
                {headerLinks.map((h) => (
                  <NavigationMenuItem key={h.href}>
                    <NavigationMenuLink href={h.href} render={<Link href={h.href} />}>{h.label}</NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
            <div className="ml-auto flex items-center gap-2">
              <SiteSearch items={searchItems} />
              <NavigationMenu align="end" className="hidden lg:flex">
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuLink href="https://github.com/aedis-build/aedis-ui">GitHub</NavigationMenuLink>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
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
