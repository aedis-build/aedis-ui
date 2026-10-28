"use client";

import * as React from "react";
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group";
import type { VariantProps } from "class-variance-authority";

import { cn, type WithClassName } from "@/lib/utils";
import { Toggle, toggleVariants, type ToggleProps } from "@/registry/aedis/ui/toggle";

type Variants = VariantProps<typeof toggleVariants>;
const Context = React.createContext<Variants>({});

type ToggleGroupProps = WithClassName<ToggleGroupPrimitive.Props<string>> & Variants;

/**
 * Toggles that act as one control: Tab enters the group once, the arrows move, Space or Enter presses. One pressed
 * at a time unless `multiple`. The segmented variant (2–6 options) always keeps one option pressed.
 */
function ToggleGroup({ className, variant, size, value, defaultValue, onValueChange, multiple, orientation, ...props }: ToggleGroupProps) {
  const segmented = variant === "segmented";
  const [inner, setInner] = React.useState<readonly string[]>(defaultValue ?? []);
  const keep = segmented && !multiple;
  return (
    <Context.Provider value={{ variant, size }}>
      <ToggleGroupPrimitive<string>
        data-slot="toggle-group"
        data-variant={variant ?? "default"}
        multiple={multiple}
        orientation={orientation}
        value={keep ? (value ?? inner) : value}
        defaultValue={keep ? undefined : defaultValue}
        onValueChange={(next, details) => {
          if (keep && next.length === 0) return;
          setInner(next);
          onValueChange?.(next, details);
        }}
        className={cn(
          "flex w-fit flex-wrap items-center gap-1 data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch",
          segmented && "flex-nowrap rounded-md bg-muted p-1",
          className,
        )}
        {...props}
      />
    </Context.Provider>
  );
}

function ToggleGroupItem({ variant, size, ...props }: ToggleProps & { value: string }) {
  const group = React.useContext(Context);
  return <Toggle data-slot="toggle-group-item" variant={variant ?? group.variant} size={size ?? group.size} {...props} />;
}

export { ToggleGroup, ToggleGroupItem };
