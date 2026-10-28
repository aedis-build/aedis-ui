"use client";

import * as React from "react";

import { useMessages, type Messages } from "@/registry/aedis/lib/locale";
import { Button, type ButtonProps } from "@/registry/aedis/ui/button";

type CopyButtonProps = Omit<ButtonProps, "onClick" | "value" | "render"> & {
  /** The exact text to copy. */
  value: string;
  onCopied?: () => void;
  labels?: Partial<Messages["copyButton"]>;
};

/**
 * Copies `value` with the Clipboard API and says Copied for 2 s. It only writes to the clipboard, never reads it.
 * Where the browser refuses, it shows the text selected next to the button, for the person to copy with the keyboard.
 */
function CopyButton({ value, onCopied, labels, children, variant = "outline", size, ...props }: CopyButtonProps) {
  const l = useMessages("copyButton", labels);
  const [state, setState] = React.useState<"idle" | "copied" | "failed">("idle");
  const field = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    // The person asked to copy: moving the focus to the selected text lets Ctrl+C finish the job.
    if (state === "failed") field.current?.focus();
    if (state !== "copied") return;
    const t = setTimeout(() => setState("idle"), 2000);
    return () => clearTimeout(t);
  }, [state]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
      onCopied?.();
    } catch {
      setState("failed");
    }
  }

  const icon =
    state === "copied" ? (
      <svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3.5 8.5l3 3 6-7" />
      </svg>
    ) : (
      <svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
        <path d="M10.5 3.5v-.5a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 3v5A1.5 1.5 0 0 0 4 9.5h.5" />
      </svg>
    );

  return (
    <span data-slot="copy-button" className="inline-flex max-w-full flex-wrap items-center gap-2">
      <Button variant={variant} size={size} onClick={copy} aria-label={size === "icon" ? l.copy : undefined} {...props}>
        {icon}
        {size === "icon" ? null : state === "copied" ? l.copied : (children ?? l.copy)}
      </Button>
      {state === "failed" ? (
        <input
          ref={field}
          readOnly
          maxLength={value.length}
          value={value}
          aria-label={l.fallback}
          onFocus={(e) => e.currentTarget.select()}
          className="h-9 min-w-0 flex-1 rounded-sm border border-border-control bg-surface px-3 font-mono text-footnote focus-ring"
        />
      ) : null}
      <span role="status" className="sr-only">
        {state === "copied" ? l.copied : state === "failed" ? l.fallback : ""}
      </span>
    </span>
  );
}

export { CopyButton };
