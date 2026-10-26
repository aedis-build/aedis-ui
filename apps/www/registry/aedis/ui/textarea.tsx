"use client";

import * as React from "react";

import { guardTextField } from "@/lib/untrusted";
import { cn } from "@/lib/utils";
import { useMessages } from "@/registry/aedis/lib/locale";

export type TextareaProps = React.ComponentProps<"textarea"> & {
  /** Keep hidden code points (zero-width, bidi, tags) as typed. Off: they are removed, so the field shows what is sent. */
  allowInvisible?: boolean;
  /** Say so when a paste is cut to maxLength. Turn off when the caller shows its own notice. */
  pasteHint?: boolean;
};

/**
 * Multi-line text input with a length limit by default; pass maxLength to change it. Without `rows` it grows with its
 * content (cap it with a max-h class); with `rows` it keeps that height. Its text is 16 px on phones, below which iOS
 * zooms into the field. Hidden code points are removed as they are typed or pasted, and a paste that does not fit says so.
 */
function Textarea({ className, maxLength = 4000, rows, allowInvisible, pasteHint = true, onChange, onPaste, ...props }: TextareaProps) {
  const l = useMessages("field");
  return (
    <textarea
      maxLength={maxLength}
      {...guardTextField<HTMLTextAreaElement>({ allowInvisible, maxLength, truncated: pasteHint ? l.truncated : null, onChange, onPaste })}
      rows={rows}
      data-slot="textarea"
      className={cn(
        "flex min-h-16 w-full rounded-sm border border-border-control bg-surface px-3 py-2 text-callout max-sm:text-body transition-colors duration-(--duration-fast) ease-out placeholder:text-muted-foreground focus-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive",
        rows === undefined && "field-sizing-content",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
