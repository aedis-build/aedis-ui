"use client";

import * as React from "react";
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";

import { cn, type WithClassName } from "@/lib/utils";

function Tabs({ className, ...props }: WithClassName<TabsPrimitive.Root.Props>) {
  return <TabsPrimitive.Root data-slot="tabs" className={cn("flex flex-col gap-3", className)} {...props} />;
}

function TabsList({ className, ...props }: WithClassName<TabsPrimitive.List.Props>) {
  return <TabsPrimitive.List data-slot="tabs-list" className={cn("inline-flex w-fit items-center gap-1 rounded-md bg-muted p-1", className)} {...props} />;
}

function TabsTrigger({ className, ...props }: WithClassName<TabsPrimitive.Tab.Props>) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "focus-ring inline-flex items-center gap-1.5 rounded-sm px-3 py-1 text-callout font-medium text-muted-foreground transition-[color,background-color,box-shadow] duration-(--duration-fast) ease-out data-disabled:opacity-50 data-active:bg-surface data-active:text-foreground data-active:shadow-elevation-1",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: WithClassName<TabsPrimitive.Panel.Props>) {
  // Focusable (a panel without focusable content is a tab stop): the ring shows where the focus went. Inset, because a
  // panel usually fills a box that clips (a card, a preview), which would cut a ring drawn outside it.
  return <TabsPrimitive.Panel data-slot="tabs-content" className={cn("rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset", className)} {...props} />;
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
