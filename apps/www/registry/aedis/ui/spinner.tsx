"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useMessages, type Messages } from "@/registry/aedis/lib/locale";

export type SpinnerLabels = Messages["spinner"];

/**
 * Loading indicator, announced politely. With reduced motion it stops rotating and shows its label as text, so the
 * state is still clear without movement.
 */
function Spinner({ className, labels, ...props }: React.ComponentProps<"span"> & { labels?: Partial<SpinnerLabels> }) {
  const l = useMessages("spinner", labels);
  return (
    <span data-slot="spinner" role="status" className={cn("inline-flex items-center gap-2 text-muted-foreground", className)} {...props}>
      <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="8" cy="8" r="6" opacity="0.25" />
        <path d="M14 8a6 6 0 0 0-6-6" strokeLinecap="round" />
      </svg>
      <span className="sr-only text-footnote motion-reduce:not-sr-only">{l.label}</span>
    </span>
  );
}

export { Spinner };
