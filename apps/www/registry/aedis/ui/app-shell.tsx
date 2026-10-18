"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export type AppShellProps = {
  /** The navigation, usually a Sidebar. */
  sidebar: React.ReactNode;
  children: React.ReactNode;
  /** Shown in the top bar on small screens, next to the menu toggle. */
  title?: React.ReactNode;
  /** Accessible name of the menu toggle on small screens. */
  menuLabel?: string;
  className?: string;
};

/** Sidebar + main layout. Below md the sidebar hides behind a toggle in a top bar. */
function AppShell({ sidebar, children, title, menuLabel = "Menu", className }: AppShellProps) {
  const [open, setOpen] = React.useState(false);
  const sidebarId = React.useId();

  return (
    <div data-slot="app-shell" className={cn("min-h-screen md:grid md:grid-cols-[15rem_1fr]", className)}>
      <div className="flex h-12 items-center gap-3 border-b border-border px-4 md:hidden">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={sidebarId}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex size-8 items-center justify-center rounded-md outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="sr-only">{menuLabel}</span>
          <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 4h12M2 8h12M2 12h12" />
          </svg>
        </button>
        <div className="min-w-0 truncate font-medium">{title}</div>
      </div>
      <div id={sidebarId} className={cn("md:sticky md:top-0 md:block md:h-screen", open ? "block" : "hidden")}>
        {sidebar}
      </div>
      <main data-slot="app-shell-main" className="min-w-0 p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}

export { AppShell };
