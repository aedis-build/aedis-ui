"use client";

import * as React from "react";
import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible";

import { cn, type WithClassName } from "@/lib/utils";

/** Shows and hides one area. Collapsed content stays findable with the browser's in-page search. */
function Collapsible(props: CollapsiblePrimitive.Root.Props) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />;
}

function CollapsibleTrigger(props: CollapsiblePrimitive.Trigger.Props) {
  return <CollapsiblePrimitive.Trigger data-slot="collapsible-trigger" {...props} />;
}

/** Height follows Base UI's measured --collapsible-panel-height; nothing is measured per frame. */
function CollapsibleContent({ className, hiddenUntilFound = true, ...props }: WithClassName<CollapsiblePrimitive.Panel.Props>) {
  return (
    <CollapsiblePrimitive.Panel
      data-slot="collapsible-content"
      hiddenUntilFound={hiddenUntilFound}
      className={cn(
        "h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-(--duration-spring) ease-spring-critical data-ending-style:h-0 data-ending-style:duration-(--duration-fast) data-starting-style:h-0 motion-reduce:transition-none",
        className,
      )}
      {...props}
    />
  );
}

export { Collapsible, CollapsibleContent, CollapsibleTrigger };
