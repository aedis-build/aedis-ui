import * as React from "react";

import { cn } from "@/lib/utils";

/** Loading placeholder. Hidden from assistive technology; announce loading state on the region instead (aria-busy). */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="skeleton" aria-hidden="true" className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />;
}

export { Skeleton };
