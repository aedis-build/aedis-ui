"use client";

import * as React from "react";
import { Progress as ProgressPrimitive } from "@base-ui/react/progress";

import { cn, type WithClassName } from "@/lib/utils";

function Progress({ className, value, ...props }: WithClassName<ProgressPrimitive.Root.Props>) {
  const clamped = value == null ? null : Math.min(100, Math.max(0, value));
  return (
    <ProgressPrimitive.Root data-slot="progress" value={clamped} className={cn("relative h-2 w-full overflow-hidden rounded-full bg-muted", className)} {...props}>
      <ProgressPrimitive.Track data-slot="progress-track" className="h-full">
        <ProgressPrimitive.Indicator
          data-slot="progress-indicator"
          className="h-full w-full flex-1 bg-primary transition-transform motion-reduce:transition-none"
          // Base UI sizes the indicator by width; a transform keeps the animation off layout.
          style={{ width: "100%", transform: `translateX(-${100 - (clamped ?? 0)}%)` }}
        />
      </ProgressPrimitive.Track>
    </ProgressPrimitive.Root>
  );
}

export { Progress };
