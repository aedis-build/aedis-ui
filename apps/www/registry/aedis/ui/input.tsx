"use client";

import * as React from "react";

import { guardTextField } from "@/lib/untrusted";
import { cn } from "@/lib/utils";
import { useMessages } from "@/registry/aedis/lib/locale";

const TEXT_TYPES = ["text", "search", "email", "url", "tel", "password"];

export type InputProps = React.ComponentProps<"input"> & {
  /** Keep hidden code points (zero-width, bidi, tags) as typed. Off: they are removed, so the field shows what is sent. */
  allowInvisible?: boolean;
  /** Say so when a paste is cut to maxLength. Turn off when the caller shows its own notice. */
  pasteHint?: boolean;
};

/**
 * Text input. Text-like types get a length limit by default; pass maxLength to change it. Hidden code points are
 * removed as they are typed or pasted, and a paste that does not fit says so.
 */
function Input({ className, type, maxLength, allowInvisible, pasteHint = true, onChange, onPaste, ...props }: InputProps) {
  const l = useMessages("field");
  const bounded = !type || TEXT_TYPES.includes(type);
  const limit = maxLength ?? (bounded ? 256 : undefined);
  return (
    <input
      type={type}
      maxLength={limit}
      {...guardTextField<HTMLInputElement>({ allowInvisible: allowInvisible || !bounded, maxLength: limit, truncated: pasteHint ? l.truncated : null, onChange, onPaste })}
      data-slot="input"
      className={cn(
        "flex h-9 w-full min-w-0 rounded-sm border border-border-control bg-surface px-3 py-1 text-callout transition-colors duration-(--duration-fast) ease-out placeholder:text-muted-foreground focus-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
