import * as React from "react";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "press focus-ring inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-sm text-callout font-medium disabled:pointer-events-none disabled:opacity-50 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-elevation-1 hover:bg-primary/90",
        secondary: "border border-hairline bg-secondary text-secondary-foreground shadow-elevation-1 hover:bg-muted",
        outline: "border border-border-control bg-surface hover:bg-muted",
        ghost: "hover:bg-muted",
        destructive: "bg-destructive-solid text-destructive-foreground shadow-elevation-1 hover:bg-destructive-solid/90",
        link: "text-link underline underline-offset-4",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-footnote",
        lg: "h-11 px-6 text-body",
        icon: "size-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    /** Another element to render with the button styles, e.g. `<a href="/docs" />`. */
    render?: useRender.RenderProp;
  };

/**
 * Pass `render` to give another element the button styles, e.g. `render={<a href="/docs" />}`.
 * It keeps its own role: a link stays a link.
 */
function Button({ className, variant, size, type, render, ...props }: ButtonProps) {
  return useRender({
    // A bare <button> inside a form submits it; default to "button" so submitting is always explicit.
    render: render ?? <ButtonPrimitive type={type ?? "button"} />,
    props: { "data-slot": "button", className: cn(buttonVariants({ variant, size }), className), ...(render ? { type } : {}), ...props },
  });
}

export { Button, buttonVariants };
