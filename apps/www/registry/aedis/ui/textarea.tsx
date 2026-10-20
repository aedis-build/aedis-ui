import * as React from "react";

import { cn } from "@/lib/utils";

/** Multi-line text input with a length limit by default; pass maxLength to change it. */
function Textarea({ className, maxLength = 4000, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      maxLength={maxLength}
      data-slot="textarea"
      className={cn(
        "flex min-h-16 w-full rounded-sm border border-border-control bg-surface px-3 py-2 text-callout transition-colors duration-(--duration-fast) ease-out placeholder:text-muted-foreground focus-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
