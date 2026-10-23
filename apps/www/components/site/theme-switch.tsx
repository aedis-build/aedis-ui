"use client";

import * as React from "react";

import { Button } from "@/registry/aedis/ui/button";

export const SCHEME_KEY = "aedis-ui-color-scheme";

const current = () =>
  (document.documentElement.getAttribute("data-theme") ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark" ? "dark" : "light";

/** Light/dark switch for the docs. The choice is applied before paint by public/color-scheme.js. */
export function ThemeSwitch() {
  const [scheme, setScheme] = React.useState<"light" | "dark" | null>(null);
  React.useEffect(() => setScheme(current()), []);
  const next = scheme === "dark" ? "light" : "dark";

  function toggle() {
    document.documentElement.setAttribute("data-theme", next);
    try {
      window.localStorage.setItem(SCHEME_KEY, next);
    } catch {
      // Storage can be blocked; the switch still works for this page.
    }
    setScheme(next);
  }

  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label={`Switch to ${next} theme`}>
      <svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        {scheme === "dark" ? (
          <>
            <circle cx="8" cy="8" r="3" />
            <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1" />
          </>
        ) : (
          <path d="M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7z" />
        )}
      </svg>
    </Button>
  );
}
