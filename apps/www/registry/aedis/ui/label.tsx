import * as React from "react";

import { cn } from "@/lib/utils";

/** Dimmed with a disabled control, whether the control comes before it, right after it or inside it. */
function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-callout font-medium leading-none select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50 peer-data-disabled:cursor-not-allowed peer-data-disabled:opacity-50 has-[+:disabled]:opacity-50 has-[+[data-disabled]]:opacity-50 has-[:disabled]:opacity-50 has-[[data-disabled]]:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
