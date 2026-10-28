"use client";

import * as React from "react";
import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import { cva, type VariantProps } from "class-variance-authority";

import { cn, type WithClassName } from "@/lib/utils";

// The ::after box keeps a 44 px target however small the toggle is drawn. Pressed is drawn by a heavier inset outline
// as well as a fill, so it does not rest on color alone.
const toggleVariants = cva(
  "press focus-ring relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-sm text-callout font-medium transition-colors duration-(--duration-fast) ease-out after:absolute after:top-1/2 after:left-1/2 after:h-11 after:w-[max(100%,2.75rem)] after:-translate-1/2 after:content-[''] hover:bg-muted data-pressed:bg-accent-soft data-pressed:text-foreground data-pressed:inset-ring-[1.5px] data-pressed:inset-ring-current data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "",
        outline: "border border-border-control bg-surface",
        segmented: "flex-1 text-muted-foreground hover:bg-transparent hover:text-foreground data-pressed:bg-surface data-pressed:shadow-elevation-1",
      },
      size: {
        default: "h-9 px-3",
        sm: "h-8 px-2.5 text-footnote",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export type ToggleProps = WithClassName<TogglePrimitive.Props> & VariantProps<typeof toggleVariants>;

/** A button that stays pressed (aria-pressed), controlled with pressed/onPressedChange or uncontrolled with defaultPressed. */
function Toggle({ className, variant, size, ...props }: ToggleProps) {
  return <TogglePrimitive data-slot="toggle" className={cn(toggleVariants({ variant, size }), className)} {...props} />;
}

export { Toggle, toggleVariants };
