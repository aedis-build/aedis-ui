"use client";

import * as React from "react";
import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area";

import { cn, type WithClassName } from "@/lib/utils";

type ScrollAreaProps = WithClassName<ScrollAreaPrimitive.Root.Props> & {
  /** Names the scrollable region; it is focusable so keyboard users can scroll it. */
  "aria-label"?: string;
};

/**
 * A scrollable region with consistent scrollbars. Scrolling stays native: wheel, touch, keyboard (the viewport takes
 * focus when it overflows) and in-page search all work as usual.
 */
function ScrollArea({ className, children, "aria-label": ariaLabel, ...props }: ScrollAreaProps) {
  return (
    <ScrollAreaPrimitive.Root data-slot="scroll-area" className={cn("relative overflow-hidden", className)} {...props}>
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        aria-label={ariaLabel}
        role={ariaLabel ? "region" : undefined}
        className="focus-ring size-full [border-radius:inherit] overscroll-contain"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollBar orientation="horizontal" />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}

/** Fades in while hovering or scrolling; always visible, without the fade, under reduced motion. */
function ScrollBar({ className, orientation = "vertical", ...props }: WithClassName<ScrollAreaPrimitive.Scrollbar.Props>) {
  return (
    <ScrollAreaPrimitive.Scrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        "flex touch-none p-0.5 opacity-0 select-none transition-opacity duration-(--duration-fast) ease-out data-hovering:opacity-100 data-scrolling:opacity-100 data-scrolling:transition-none motion-reduce:opacity-100 motion-reduce:transition-none data-[orientation=horizontal]:h-2.5 data-[orientation=horizontal]:flex-col data-[orientation=vertical]:w-2.5",
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb data-slot="scroll-area-thumb" className="relative flex-1 rounded-full bg-border-control" />
    </ScrollAreaPrimitive.Scrollbar>
  );
}

export { ScrollArea, ScrollBar };
