"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { CommandDialog, type CommandItem } from "@/registry/aedis/ui/command";
import { Kbd } from "@/registry/aedis/ui/kbd";

/** ⌘K / Ctrl+K search over the components and guides. The index is built from content/components.tsx at build time. */
export function SiteSearch({ items }: { items: CommandItem[] }) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="press focus-ring flex h-9 items-center gap-2 rounded-sm bg-muted px-3 text-callout text-muted-foreground md:w-52"
      >
        <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <circle cx="7" cy="7" r="5" />
          <path d="M11 11l3.5 3.5" />
        </svg>
        <span className="sr-only md:not-sr-only md:flex-1 md:text-left">Search docs</span>
        <Kbd aria-hidden="true" className="hidden md:inline-flex">⌘K</Kbd>
      </button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        items={items}
        labels={{ label: "Search components and docs" }}
        onSelect={(item) => {
          setOpen(false);
          // llms.txt and llms-full.txt are files, not pages: load them, do not route.
          if (item.value.endsWith(".txt")) window.location.assign(item.value);
          else router.push(item.value);
        }}
      />
    </>
  );
}
