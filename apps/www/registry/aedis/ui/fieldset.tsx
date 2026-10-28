"use client";

import * as React from "react";
import { Fieldset as FieldsetPrimitive } from "@base-ui/react/fieldset";

import { cn, type WithClassName } from "@/lib/utils";

/** A group of fields or choices (checkboxes, a toggle group) named by its legend. Disabling it disables them all. */
function Fieldset({ className, ...props }: WithClassName<FieldsetPrimitive.Root.Props>) {
  return <FieldsetPrimitive.Root data-slot="fieldset" className={cn("m-0 flex min-w-0 flex-col gap-3 border-0 p-0", className)} {...props} />;
}

function FieldsetLegend({ className, ...props }: WithClassName<FieldsetPrimitive.Legend.Props>) {
  return <FieldsetPrimitive.Legend data-slot="fieldset-legend" className={cn("text-callout font-semibold", className)} {...props} />;
}

export { Fieldset, FieldsetLegend };
