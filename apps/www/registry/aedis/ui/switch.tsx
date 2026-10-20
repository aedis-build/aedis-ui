"use client";

import * as React from "react";
import { Switch as SwitchPrimitive } from "@base-ui/react/switch";

import { cn, type WithClassName } from "@/lib/utils";

function Switch({ className, ...props }: WithClassName<SwitchPrimitive.Root.Props>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "focus-ring peer inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-transparent transition-colors duration-(--duration-fast) ease-out data-disabled:cursor-not-allowed data-disabled:opacity-50 data-checked:bg-primary data-unchecked:bg-border-control",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block size-4 rounded-full bg-surface shadow-elevation-1 transition-transform duration-(--duration-spring) ease-spring-critical motion-reduce:transition-none data-checked:translate-x-4 data-unchecked:translate-x-0.5"
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
