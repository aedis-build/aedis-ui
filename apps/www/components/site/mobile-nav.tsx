"use client";

import * as React from "react";
import Link from "next/link";

import { Button } from "@/registry/aedis/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/registry/aedis/ui/sheet";

/** The docs navigation on phones: the same links as the sidebar, in a sheet. */
export function MobileNav({ items }: { items: { name: string; title: string }[] }) {
  const [open, setOpen] = React.useState(false);
  return (
    <Sheet side="left" open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden" />}>
        <svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 4h12M2 8h12M2 12h12" />
        </svg>
        <span className="sr-only">Menu</span>
      </SheetTrigger>
      <SheetContent>
        <SheetTitle>Aedis UI</SheetTitle>
        <nav aria-label="Docs">
          <ul className="space-y-1">
            {[{ name: "theming", title: "Theming" }, { name: "server-actions", title: "Server Actions" }, { name: "micro-frontends", title: "Micro-frontends" }, ...items].map((c) => (
              <li key={c.name}>
                <Link href={`/docs/${c.name}`} onClick={() => setOpen(false)} className="focus-ring block rounded-sm px-2 py-1.5 hover:bg-muted">
                  {c.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
