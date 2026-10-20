import * as React from "react";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Separator } from "@/registry/aedis/ui/separator";

const buttonGroupVariants = cva(
  "flex w-fit items-stretch has-[>[data-slot=button-group]]:gap-2 [&>*]:focus-visible:relative [&>*]:focus-visible:z-10 [&>input]:flex-1",
  {
    variants: {
      orientation: {
        horizontal:
          "[&>[data-slot]:not(:first-child)]:rounded-l-none [&>[data-slot]:not(:last-child)]:rounded-r-none [&>[data-slot]~[data-slot]]:border-l-0",
        vertical:
          "flex-col [&>[data-slot]:not(:first-child)]:rounded-t-none [&>[data-slot]:not(:last-child)]:rounded-b-none [&>[data-slot]~[data-slot]]:border-t-0",
      },
    },
    defaultVariants: { orientation: "horizontal" },
  },
);

/** A group needs a name so assistive technology can say what the buttons are for. */
type GroupName = { "aria-label": string; "aria-labelledby"?: string } | { "aria-label"?: string; "aria-labelledby": string };

export type ButtonGroupProps = Omit<React.ComponentProps<"div">, "aria-label" | "aria-labelledby"> & VariantProps<typeof buttonGroupVariants> & GroupName;

/** Buttons that belong together (toolbars, segmented actions). Each button keeps its own semantics. */
function ButtonGroup({ className, orientation, ...props }: ButtonGroupProps) {
  return (
    <div
      role="group"
      data-slot="button-group"
      data-orientation={orientation ?? "horizontal"}
      className={cn(buttonGroupVariants({ orientation }), className)}
      {...props}
    />
  );
}

function ButtonGroupText({ className, render, ...props }: useRender.ComponentProps<"div">) {
  return useRender({
    defaultTagName: "div",
    render,
    props: {
      "data-slot": "button-group-text",
      className: cn("flex items-center gap-2 rounded-sm border border-border-control bg-muted px-3 text-callout font-medium [&_svg]:pointer-events-none [&_svg]:size-4", className),
      ...props,
    },
  });
}

function ButtonGroupSeparator({ className, orientation = "vertical", ...props }: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="button-group-separator"
      orientation={orientation}
      className={cn("relative self-stretch bg-border-control data-[orientation=horizontal]:w-auto data-[orientation=vertical]:h-auto", className)}
      {...props}
    />
  );
}

export { ButtonGroup, ButtonGroupSeparator, ButtonGroupText, buttonGroupVariants };
