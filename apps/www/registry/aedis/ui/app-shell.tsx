"use client";

import * as React from "react";

import { stripInvisible } from "@/lib/untrusted";
import { cn } from "@/lib/utils";
import { useMessages, type Messages } from "@/registry/aedis/lib/locale";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/registry/aedis/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/registry/aedis/ui/sheet";

export type AppShellLabels = Messages["appShell"];

export type AppShellProps = {
  /** The navigation, usually a Sidebar. Leave it out for account pages: a top bar over one content column. */
  sidebar?: React.ReactNode;
  /** Without a sidebar: the start of the top bar (mark, account switcher, plan badge). */
  start?: React.ReactNode;
  /** Without a sidebar: the end of the top bar (links, avatar menu). Hide secondary links below md yourself. */
  end?: React.ReactNode;
  /** Without a sidebar: a Breadcrumb shown under the top bar. */
  breadcrumb?: React.ReactNode;
  children: React.ReactNode;
  /** Shown in the top bar on small screens, next to the menu toggle. */
  title?: React.ReactNode;
  /** Accessible name of the menu toggle on small screens. Defaults to the dictionary. */
  menuLabel?: string;
  /** The content is the page's <main>. Pass false when the shell sits inside a page that already has one. */
  main?: boolean | undefined;
  className?: string | undefined;
};

/**
 * Sidebar + main layout. Below md the sidebar opens in a Sheet from the toggle in the top bar: it takes the focus,
 * Escape or a tap outside closes it, and so does following one of its links.
 */
function AppShell({ sidebar, start, end, breadcrumb, children, title, menuLabel, main = true, className }: AppShellProps) {
  const t = useMessages("appShell", menuLabel ? { menuLabel } : undefined);
  const [open, setOpen] = React.useState(false);
  const Content = main ? "main" : "div";

  // Account pages: one 12-column grid, left-aligned at most 1120 px, so the left edge never moves between pages.
  if (sidebar == null) {
    const column = "box-content max-w-280 px-4 md:px-8";
    return (
      <div data-slot="app-shell" data-layout="account" className={cn("min-h-screen", className)}>
        <header data-slot="app-shell-header" className="material-regular scroll-edge sticky top-0 z-40">
          <div className={cn(column, "flex min-h-14 items-center gap-3")}>
            <div className="flex min-w-0 items-center gap-2">{start}</div>
            <div className="ms-auto flex shrink-0 items-center gap-2">{end}</div>
          </div>
          {breadcrumb ? (
            <div data-slot="app-shell-breadcrumb" className={cn(column, "flex min-h-11 items-center [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center")}>
              {breadcrumb}
            </div>
          ) : null}
        </header>
        {/* Children span the grid; a narrower page passes col-span-8 (or less) and keeps the same left edge. */}
        <Content data-slot="app-shell-main" className={cn(column, "grid grid-cols-12 gap-6 py-6 md:py-8 [:where(&>*)]:col-span-full")}>
          {children}
        </Content>
      </div>
    );
  }

  return (
    <div data-slot="app-shell" className={cn("min-h-screen md:grid md:grid-cols-[15rem_1fr]", className)}>
      <div className="material-regular scroll-edge sticky top-0 z-40 flex h-12 items-center gap-3 px-4 md:hidden">
        <Sheet side="left" open={open} onOpenChange={setOpen}>
          <SheetTrigger className="press focus-ring inline-flex size-8 items-center justify-center rounded-sm hover:bg-muted">
            <span className="sr-only">{t.menuLabel}</span>
            <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 4h12M2 8h12M2 12h12" />
            </svg>
          </SheetTrigger>
          <SheetContent
            onClick={(e) => {
              if ((e.target as HTMLElement).closest("a[href]")) setOpen(false);
            }}
          >
            <SheetTitle className="sr-only">{t.menuLabel}</SheetTitle>
            {sidebar}
          </SheetContent>
        </Sheet>
        <div className="min-w-0 truncate text-headline">{title}</div>
      </div>
      {/* Its own scroller, never taller than the screen nor than the shell: the footer stays in view. */}
      <div className="hidden md:sticky md:top-0 md:block md:max-h-screen md:overflow-y-auto">{sidebar}</div>
      <Content data-slot="app-shell-main" className="min-w-0 p-4 md:p-8">
        {children}
      </Content>
    </div>
  );
}

export type AppShellAccountSwitcherProps = {
  /** Name of the current account, shown on the button and in its accessible name. */
  current: string;
  /** The menu: DropdownMenuItem or DropdownMenuLinkItem per account. */
  children: React.ReactNode;
  labels?: Partial<AppShellLabels> | undefined;
  className?: string | undefined;
};

/** The account switcher of the top bar. Its name says which account is current ("Switch account, current: Acme"). */
function AppShellAccountSwitcher({ current, children, labels, className }: AppShellAccountSwitcherProps) {
  const l = useMessages("appShell", labels);
  const name = stripInvisible(current);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={l.switchAccount.replace("{account}", name)}
        className={cn("press focus-ring inline-flex min-h-11 min-w-0 items-center gap-1.5 rounded-sm px-2 text-callout font-medium hover:bg-muted", className)}
      >
        <span className="truncate">{name}</span>
        <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="m5 6 3-3 3 3M5 10l3 3 3-3" />
        </svg>
      </DropdownMenuTrigger>
      <DropdownMenuContent>{children}</DropdownMenuContent>
    </DropdownMenu>
  );
}

export { AppShell, AppShellAccountSwitcher };
