"use client";

import * as React from "react";
import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";

import { cn } from "@/lib/utils";
import { useMessages, type Messages } from "@/registry/aedis/lib/locale";

/** Labels are plain strings: an option can never carry markup. */
export type ComboboxOption = { value: string; label: string; disabled?: boolean };

type ComboboxProps = {
  options: ComboboxOption[];
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  placeholder?: string;
  name?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  /** Names the input when there is no FieldLabel. */
  "aria-label"?: string;
  /** Classes for the wrapper of the input. */
  className?: string;
  labels?: Partial<Messages["combobox"]>;
};

/**
 * Chooses one option from a longer list by typing to filter it. Put it in a Field: the FieldLabel names the input.
 * The query is bounded to 256 characters; what is sent is the chosen option's value, never the typed text.
 */
function Combobox({ options, value, defaultValue, onValueChange, placeholder, name, id, disabled, required, "aria-label": ariaLabel, className, labels }: ComboboxProps) {
  const l = useMessages("combobox", labels);
  const toggle = React.useId();
  const find = (v: string | null | undefined) => (v == null ? v : (options.find((o) => o.value === v) ?? null));
  return (
    <ComboboxPrimitive.Root
      items={options}
      value={find(value)}
      defaultValue={find(defaultValue)}
      onValueChange={(o: ComboboxOption | null) => onValueChange?.(o?.value ?? null)}
      itemToStringValue={(o: ComboboxOption) => o.value}
      name={name}
      disabled={disabled}
      required={required}
    >
      <div data-slot="combobox" className={cn("relative w-full min-w-0", className)}>
        <ComboboxPrimitive.Input
          id={id}
          aria-label={ariaLabel}
          placeholder={placeholder}
          maxLength={256}
          className="flex h-9 w-full min-w-0 rounded-sm border border-border-control bg-surface py-1 pr-9 pl-3 text-callout transition-colors duration-(--duration-fast) ease-out placeholder:text-muted-foreground focus-ring disabled:cursor-not-allowed disabled:opacity-50 data-invalid:border-destructive aria-invalid:border-destructive"
        />
        {/* Inside a Field the trigger would take the field's label; it says what it does instead. */}
        <span id={toggle} hidden>
          {l.toggle}
        </span>
        <ComboboxPrimitive.Trigger aria-labelledby={toggle} className="absolute inset-y-0 right-0 flex w-9 items-center justify-center rounded-r-sm text-muted-foreground focus-ring">
          <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4.5 6.5l3.5 3.5 3.5-3.5" />
          </svg>
        </ComboboxPrimitive.Trigger>
      </div>
      <ComboboxPrimitive.Portal>
        <ComboboxPrimitive.Positioner className="z-50 outline-none" sideOffset={6}>
          <ComboboxPrimitive.Popup
            data-slot="combobox-content"
            className="materialize material-regular max-h-[min(var(--available-height),20rem)] w-(--anchor-width) overflow-y-auto rounded-md border border-hairline p-1 text-callout shadow-elevation-2 outline-none"
          >
            <ComboboxPrimitive.Empty className="px-2 py-1.5 text-muted-foreground empty:hidden">{l.empty}</ComboboxPrimitive.Empty>
            <ComboboxPrimitive.List>
              {(o: ComboboxOption) => (
                <ComboboxPrimitive.Item
                  key={o.value}
                  value={o}
                  disabled={o.disabled}
                  data-slot="combobox-item"
                  className="relative flex cursor-default items-center rounded-sm py-1.5 pr-8 pl-2 outline-none select-none transition-colors duration-(--duration-fast) ease-out data-highlighted:bg-accent-soft data-disabled:pointer-events-none data-disabled:opacity-50"
                >
                  {o.label}
                  <ComboboxPrimitive.ItemIndicator className="absolute right-2 flex items-center">
                    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3.5 8.5l3 3 6-7" />
                    </svg>
                  </ComboboxPrimitive.ItemIndicator>
                </ComboboxPrimitive.Item>
              )}
            </ComboboxPrimitive.List>
          </ComboboxPrimitive.Popup>
        </ComboboxPrimitive.Positioner>
      </ComboboxPrimitive.Portal>
    </ComboboxPrimitive.Root>
  );
}

export { Combobox };
