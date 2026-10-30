"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useMessages, type Messages } from "@/registry/aedis/lib/locale";
import { Button } from "@/registry/aedis/ui/button";
import { Link } from "@/registry/aedis/ui/link";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from "@/registry/aedis/ui/navigation-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/registry/aedis/ui/sheet";

export type SiteHeaderLabels = Messages["siteHeader"];
export type SiteHeaderItem = { label: string; href: string; active?: boolean };

export type SiteHeaderProps = {
  brand: React.ReactNode;
  homeHref?: string;
  items: SiteHeaderItem[];
  actions?: React.ReactNode;
  labels?: Partial<SiteHeaderLabels>;
  className?: string;
};

/**
 * The top bar of a site: brand, navigation and actions. From md up the items are a NavigationMenu; below md they and
 * the actions move into a Sheet that closes when a link is followed. Every href goes through safeUrl.
 */
function SiteHeader({ brand, homeHref = "/", items, actions, labels, className }: SiteHeaderProps) {
  const l = useMessages("siteHeader", labels);
  const [open, setOpen] = React.useState(false);
  const close = () => setOpen(false);
  return (
    <header data-slot="site-header" className={cn("material-regular scroll-edge sticky top-0 z-40", className)}>
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href={homeHref} aria-label={typeof brand === "string" ? undefined : l.home} className="focus-ring inline-flex min-h-6 items-center rounded-xs text-headline text-foreground no-underline">
          {brand}
        </Link>
        <div className="flex items-center gap-2">
          <NavigationMenu align="end" className="hidden md:flex">
            <NavigationMenuList>
              {items.map((item) => (
                <NavigationMenuItem key={item.href} active={item.active}>
                  <NavigationMenuLink href={item.href} active={item.active}>
                    {item.label}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
          {actions ? <div className="hidden items-center gap-2 md:flex">{actions}</div> : null}
          <Sheet side="right" open={open} onOpenChange={setOpen}>
            <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden" />}>
              <svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 4h12M2 8h12M2 12h12" />
              </svg>
              <span className="sr-only">{l.menu}</span>
            </SheetTrigger>
            <SheetContent>
              <SheetTitle>{l.menu}</SheetTitle>
              <nav aria-label={l.menu}>
                <ul className="space-y-1">
                  {items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={close}
                        aria-current={item.active ? "page" : undefined}
                        className="focus-ring block rounded-sm px-2 py-1.5 text-foreground no-underline hover:bg-muted aria-[current=page]:bg-accent-soft aria-[current=page]:font-medium"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
              {/* Actions are usually links or buttons that navigate; following one closes the sheet. */}
              {actions ? (
                <div data-slot="site-header-actions" className="flex flex-col items-start gap-2" onClick={close}>
                  {actions}
                </div>
              ) : null}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

export { SiteHeader };
