"use client";

import * as React from "react";

import { DocsNav, type NavGroup } from "@/components/site/docs-nav";
import { Button } from "@/registry/aedis/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/registry/aedis/ui/sheet";

/** The docs navigation on phones: the same groups as the sidebar, in a sheet. */
export function MobileNav({ groups }: { groups: NavGroup[] }) {
  const [open, setOpen] = React.useState(false);
  return (
    <Sheet side="left" open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden" />}>
        <svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 4h12M2 8h12M2 12h12" />
        </svg>
        <span className="sr-only">Menu</span>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetTitle>Aedis UI</SheetTitle>
        <DocsNav groups={groups} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
