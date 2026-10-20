import * as React from "react";

import { cn } from "@/lib/utils";

/** A key, e.g. ⌘ or Enter. */
function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "pointer-events-none inline-flex h-5 min-w-5 items-center justify-center gap-1 rounded-xs border border-hairline bg-muted px-1 font-sans text-caption text-muted-foreground shadow-elevation-1 select-none in-data-[slot=tooltip-content]:border-transparent in-data-[slot=tooltip-content]:bg-background/20 in-data-[slot=tooltip-content]:text-background [&_svg]:size-3",
        className,
      )}
      {...props}
    />
  );
}

/** A key combination: nested kbd elements, as HTML specifies. */
function KbdGroup({ className, ...props }: React.ComponentProps<"kbd">) {
  return <kbd data-slot="kbd-group" className={cn("inline-flex items-center gap-1", className)} {...props} />;
}

export { Kbd, KbdGroup };
