import * as React from "react";

import { cn } from "@/lib/utils";

const TEXT_TYPES = ["text", "search", "email", "url", "tel", "password"];

/** Text input. Text-like types get a length limit by default; pass maxLength to change it. */
function Input({ className, type, maxLength, ...props }: React.ComponentProps<"input">) {
  const bounded = !type || TEXT_TYPES.includes(type);
  return (
    <input
      type={type}
      maxLength={maxLength ?? (bounded ? 256 : undefined)}
      data-slot="input"
      className={cn(
        "flex h-9 w-full min-w-0 rounded-md border border-border bg-background px-3 py-1 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
