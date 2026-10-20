import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative grid w-full gap-0.5 rounded-md border px-4 py-3 text-left text-callout has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-3 has-data-[slot=alert-action]:pr-24 [&>svg]:row-span-2 [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "border-hairline bg-surface text-foreground",
        success: "border-hairline bg-surface text-success",
        warning: "border-hairline bg-surface text-warning",
        destructive: "border-hairline bg-surface text-destructive",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export type AlertProps = React.ComponentProps<"div"> & VariantProps<typeof alertVariants>;

/**
 * A callout. Only `destructive` (an error) interrupts with role="alert"; the others are polite status messages.
 * Show a message you wrote, never the server's error text (it can disclose internals).
 */
function Alert({ className, variant, role, ...props }: AlertProps) {
  return <div data-slot="alert" data-variant={variant ?? "default"} role={role ?? (variant === "destructive" ? "alert" : "status")} className={cn(alertVariants({ variant }), className)} {...props} />;
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="alert-title" className={cn("font-semibold [svg~&]:col-start-2", className)} {...props} />;
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="alert-description" className={cn("text-muted-foreground [svg~&]:col-start-2 [&_p:not(:last-child)]:mb-2", className)} {...props} />;
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="alert-action" className={cn("absolute top-2.5 right-3", className)} {...props} />;
}

export { Alert, AlertAction, AlertDescription, AlertTitle, alertVariants };
