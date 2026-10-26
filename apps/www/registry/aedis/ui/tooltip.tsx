"use client";

import * as React from "react";
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";

import { cn, type WithClassName } from "@/lib/utils";

function TooltipProvider({ delay = 300, ...props }: TooltipPrimitive.Provider.Props) {
  return <TooltipPrimitive.Provider data-slot="tooltip-provider" delay={delay} {...props} />;
}

const TooltipContext = React.createContext<{ id: string; toggle: () => void } | null>(null);

/**
 * The text is the trigger's description for assistive tech at all times (the popup stays mounted, hidden), not only
 * while it shows. A tap toggles it on touch screens, where there is no hover.
 */
function Tooltip({ open: openProp, onOpenChange, defaultOpen = false, ...props }: TooltipPrimitive.Root.Props) {
  const id = React.useId();
  const [ownOpen, setOwnOpen] = React.useState(defaultOpen);
  const open = openProp ?? ownOpen;
  const openNow = React.useRef(open);
  openNow.current = open;
  const change = React.useCallback<NonNullable<TooltipPrimitive.Root.Props["onOpenChange"]>>(
    (next, details) => {
      setOwnOpen(next);
      onOpenChange?.(next, details);
    },
    [onOpenChange],
  );
  // After the press settles: Base UI closes a tooltip on press, which would undo a toggle made during it.
  const context = React.useMemo(
    () => ({
      id,
      toggle: () => {
        const next = !openNow.current;
        setTimeout(() => setOwnOpen(next));
      },
    }),
    [id],
  );
  return (
    <TooltipContext.Provider value={context}>
      <TooltipProvider>
        <TooltipPrimitive.Root data-slot="tooltip" open={open} onOpenChange={change} {...props} />
      </TooltipProvider>
    </TooltipContext.Provider>
  );
}

function TooltipTrigger({ onPointerUp, ...props }: TooltipPrimitive.Trigger.Props) {
  const context = React.useContext(TooltipContext);
  return (
    <TooltipPrimitive.Trigger
      data-slot="tooltip-trigger"
      aria-describedby={context?.id}
      onPointerUp={(event) => {
        onPointerUp?.(event);
        if (event.pointerType === "touch") context?.toggle();
      }}
      {...props}
    />
  );
}

type TooltipContentProps = WithClassName<TooltipPrimitive.Popup.Props> &
  Pick<TooltipPrimitive.Positioner.Props, "side" | "sideOffset" | "align" | "alignOffset">;

function TooltipContent({ className, side, sideOffset = 4, align, alignOffset, ...props }: TooltipContentProps) {
  const context = React.useContext(TooltipContext);
  return (
    <TooltipPrimitive.Portal keepMounted>
      <TooltipPrimitive.Positioner side={side} sideOffset={sideOffset} align={align} alignOffset={alignOffset} className="z-50">
        <TooltipPrimitive.Popup
          id={context?.id}
          role="tooltip"
          data-slot="tooltip-content"
          className={cn(
            "materialize z-50 max-w-xs rounded-sm bg-foreground px-3 py-1.5 text-footnote text-background shadow-elevation-2",
            className,
          )}
          {...props}
        />
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
