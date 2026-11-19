import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1 whitespace-nowrap rounded-xs border px-2 py-0.5 text-caption",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-muted text-foreground",
        accent: "border-transparent bg-accent text-accent-foreground",
        outline: "border-border-control text-foreground",
        destructive: "border-transparent bg-destructive-solid text-destructive-foreground",
        // A quiet pill: colour lives only in the dot, the text carries the meaning.
        status: "gap-1.5 rounded-full border-border text-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

const dotTones = { ok: "bg-success", attention: "bg-warning", neutral: "bg-muted-foreground" } as const;

function Badge({
  className,
  variant,
  tone = "neutral",
  children,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { tone?: keyof typeof dotTones }) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props}>
      {variant === "status" && <span aria-hidden="true" data-slot="badge-dot" data-tone={tone} className={cn("size-1.5 shrink-0 rounded-full", dotTones[tone])} />}
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
