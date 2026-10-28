"use client";

import * as React from "react";
import { Select as SelectPrimitive } from "@base-ui/react/select";

import { cn } from "@/lib/utils";

/** Labels are plain strings: an option can never carry markup. */
export type SelectOption = { value: string; label: string; disabled?: boolean };
export type SelectOptionGroup = { label: string; options: SelectOption[] };

type SelectProps = Omit<SelectPrimitive.Root.Props<string, false>, "items" | "children" | "multiple"> & {
  options: (SelectOption | SelectOptionGroup)[];
  /** Shown while nothing is chosen. */
  placeholder?: string;
  /** Names the trigger when there is no FieldLabel. */
  "aria-label"?: string;
  /** Classes for the trigger. */
  className?: string;
};

const isGroup = (o: SelectOption | SelectOptionGroup): o is SelectOptionGroup => "options" in o;

/**
 * Chooses one option from a list. Put it in a Field: the FieldLabel names it and the field's error state marks it
 * invalid. Options can be grouped and disabled.
 */
function Select({ options, placeholder, id, "aria-label": ariaLabel, className, ...props }: SelectProps) {
  const items = options.flatMap((o) => (isGroup(o) ? o.options : [o]));
  const item = (o: SelectOption) => (
    <SelectPrimitive.Item
      key={o.value}
      value={o.value}
      disabled={o.disabled}
      data-slot="select-item"
      className="relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 outline-none select-none transition-colors duration-(--duration-fast) ease-out data-highlighted:bg-accent-soft data-disabled:pointer-events-none data-disabled:opacity-50"
    >
      <SelectPrimitive.ItemText>{o.label}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute right-2 flex items-center">
        <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3.5 8.5l3 3 6-7" />
        </svg>
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
  return (
    <SelectPrimitive.Root items={items} {...props}>
      <SelectPrimitive.Trigger
        id={id}
        aria-label={ariaLabel}
        data-slot="select-trigger"
        className={cn(
          "flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-sm border border-border-control bg-surface px-3 text-left text-callout transition-colors duration-(--duration-fast) ease-out focus-ring data-disabled:cursor-not-allowed data-disabled:opacity-50 data-invalid:border-destructive aria-invalid:border-destructive",
          className,
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} className="truncate data-placeholder:text-muted-foreground" />
        <SelectPrimitive.Icon className="shrink-0 text-muted-foreground">
          <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4.5 6.5l3.5 3.5 3.5-3.5" />
          </svg>
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner className="z-50 outline-none" sideOffset={6} alignItemWithTrigger={false}>
          <SelectPrimitive.Popup
            data-slot="select-content"
            className="materialize material-regular max-h-(--available-height) min-w-(--anchor-width) overflow-y-auto rounded-md border border-hairline p-1 text-callout shadow-elevation-2 outline-none"
          >
            <SelectPrimitive.List>
              {options.map((o) =>
                isGroup(o) ? (
                  <SelectPrimitive.Group key={o.label} data-slot="select-group">
                    <SelectPrimitive.GroupLabel className="px-2 pt-2 pb-1 text-footnote font-medium text-muted-foreground">{o.label}</SelectPrimitive.GroupLabel>
                    {o.options.map(item)}
                  </SelectPrimitive.Group>
                ) : (
                  item(o)
                ),
              )}
            </SelectPrimitive.List>
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

export { Select };
