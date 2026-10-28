"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useMessages } from "@/registry/aedis/lib/locale";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/registry/aedis/ui/sheet";

export type AppShellProps = {
  /** The navigation, usually a Sidebar. */
  sidebar: React.ReactNode;
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
function AppShell({ sidebar, children, title, menuLabel, main = true, className }: AppShellProps) {
  const t = useMessages("appShell", menuLabel ? { menuLabel } : undefined);
  const [open, setOpen] = React.useState(false);
  const Content = main ? "main" : "div";

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

export { AppShell };
