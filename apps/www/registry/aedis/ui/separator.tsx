"use client";

import * as React from "react";
import { Separator as SeparatorPrimitive } from "@base-ui/react/separator";

import { cn, type WithClassName } from "@/lib/utils";

type SeparatorProps = WithClassName<SeparatorPrimitive.Props> & {
  /** Purely visual, hidden from assistive technology. Set false when it separates content meaningfully. */
  decorative?: boolean;
};

function Separator({ className, orientation = "horizontal", decorative = true, ...props }: SeparatorProps) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      {...(decorative ? { role: "none", "aria-orientation": undefined } : {})}
      className={cn(
        "shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        className,
      )}
      {...props}
    />
  );
}

export { Separator };
