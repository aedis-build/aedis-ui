import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Multi-line text input with a length limit by default; pass maxLength to change it. It grows with its content (cap it
 * with a max-h class), and its text is 16 px on phones, below which iOS zooms into the field.
 */
function Textarea({ className, maxLength = 4000, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      maxLength={maxLength}
      data-slot="textarea"
      className={cn(
        "flex min-h-16 w-full rounded-sm border border-border-control bg-surface px-3 py-2 text-body field-sizing-content sm:text-callout transition-colors duration-(--duration-fast) ease-out placeholder:text-muted-foreground focus-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
