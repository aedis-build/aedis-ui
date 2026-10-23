"use client";

import * as React from "react";
import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";

import { cn, type WithClassName } from "@/lib/utils";

/** Sections that expand. Collapsed content stays findable with the browser's in-page search. */
function Accordion({ className, hiddenUntilFound = true, ...props }: WithClassName<AccordionPrimitive.Root.Props>) {
  return <AccordionPrimitive.Root data-slot="accordion" hiddenUntilFound={hiddenUntilFound} className={cn("flex w-full flex-col", className)} {...props} />;
}

function AccordionItem({ className, ...props }: WithClassName<AccordionPrimitive.Item.Props>) {
  return <AccordionPrimitive.Item data-slot="accordion-item" className={cn("border-b border-border last:border-b-0", className)} {...props} />;
}

function AccordionTrigger({ className, children, ...props }: WithClassName<AccordionPrimitive.Trigger.Props>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "group focus-ring flex flex-1 items-start justify-between gap-4 rounded-xs py-3 text-left text-headline transition-colors duration-(--duration-fast) ease-out hover:text-link data-disabled:pointer-events-none data-disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {children}
        <Chevron className="mt-[calc((1lh-1rem)/2)]" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

/** Height follows Base UI's measured --accordion-panel-height; nothing is measured per frame. */
function AccordionContent({ className, children, ...props }: WithClassName<AccordionPrimitive.Panel.Props>) {
  return (
    <AccordionPrimitive.Panel
      data-slot="accordion-content"
      className="h-(--accordion-panel-height) overflow-hidden text-callout text-muted-foreground transition-[height] duration-(--duration-spring) ease-spring-critical data-ending-style:h-0 data-ending-style:duration-(--duration-fast) data-starting-style:h-0 motion-reduce:transition-none"
      {...props}
    >
      <div className={cn("pb-4", className)}>{children}</div>
    </AccordionPrimitive.Panel>
  );
}

/** Centred in a row; the accordion trigger centres it on its first line instead, since titles may wrap. */
function Chevron({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-(--duration-spring) ease-spring-critical group-data-panel-open:rotate-180 motion-reduce:transition-none", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="m4 6 4 4 4-4" />
    </svg>
  );
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Chevron as AccordionChevron };
