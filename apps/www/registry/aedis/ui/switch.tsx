"use client";

import * as React from "react";
import { Switch as SwitchPrimitive } from "@base-ui/react/switch";

import { cn, type WithClassName } from "@/lib/utils";

/** 20 px tall, with an invisible 24 px hit area. The thumb moves in rem, so it stays centred at any root font size. */
function Switch({ className, ...props }: WithClassName<SwitchPrimitive.Root.Props>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "focus-ring peer relative inline-flex h-5 w-9 shrink-0 items-center rounded-full px-0.5 transition-colors after:absolute after:inset-x-0 after:-inset-y-0.5 after:content-[''] duration-(--duration-fast) ease-out data-disabled:cursor-not-allowed data-disabled:opacity-50 data-checked:bg-primary data-unchecked:bg-border-control",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block size-4 rounded-full bg-surface shadow-elevation-1 transition-transform duration-(--duration-spring) ease-spring-critical motion-reduce:transition-none data-checked:translate-x-full data-unchecked:translate-x-0"
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
