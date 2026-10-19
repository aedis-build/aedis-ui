import * as React from "react";

import { cn } from "@/lib/utils";

/** Multi-line text input with a length limit by default; pass maxLength to change it. */
function Textarea({ className, maxLength = 4000, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      maxLength={maxLength}
      data-slot="textarea"
      className={cn(
        "flex min-h-16 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
