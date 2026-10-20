"use client";

import * as React from "react";
import { Drawer as SheetPrimitive } from "@base-ui/react/drawer";

import { cn, type WithClassName } from "@/lib/utils";
import { useMessages, type Messages } from "@/registry/aedis/lib/locale";
import { Button } from "@/registry/aedis/ui/button";

export type SheetLabels = Messages["sheet"];
export type SheetSide = "top" | "right" | "bottom" | "left";

const swipe = { top: "up", right: "right", bottom: "down", left: "left" } as const;
const SideContext = React.createContext<SheetSide>("right");

/** A panel from the edge of the screen. Modal: focus is trapped, the page behind is inert, Escape closes. */
function Sheet({ side = "right", ...props }: SheetPrimitive.Root.Props & { side?: SheetSide }) {
  return (
    <SideContext.Provider value={side}>
      <SheetPrimitive.Root data-slot="sheet" swipeDirection={swipe[side]} {...props} />
    </SideContext.Provider>
  );
}

function SheetTrigger(props: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose(props: SheetPrimitive.Close.Props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

const position: Record<SheetSide, string> = {
  right: "inset-y-0 right-0 h-full w-3/4 rounded-l-xl border-l sm:max-w-sm",
  left: "inset-y-0 left-0 h-full w-3/4 rounded-r-xl border-r sm:max-w-sm",
  bottom: "inset-x-0 bottom-0 max-h-[85dvh] rounded-t-xl border-t pb-[env(safe-area-inset-bottom)]",
  top: "inset-x-0 top-0 max-h-[85dvh] rounded-b-xl border-b",
};

type SheetContentProps = WithClassName<SheetPrimitive.Popup.Props> & {
  showCloseButton?: boolean;
  labels?: Partial<SheetLabels>;
};

function SheetContent({ className, children, showCloseButton = true, labels, ...props }: SheetContentProps) {
  const side = React.useContext(SideContext);
  const l = useMessages("sheet", labels);
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Backdrop data-slot="sheet-overlay" className="sheet-backdrop fixed inset-0 z-50 bg-scrim" />
      <SheetPrimitive.Viewport className="fixed inset-0 z-50 pointer-events-none">
        <SheetPrimitive.Popup
          data-slot="sheet-content"
          data-side={side}
          className={cn("sheet material-thick pointer-events-auto fixed flex flex-col overflow-y-auto overscroll-contain border-hairline text-callout shadow-elevation-4 outline-none", position[side], className)}
          {...props}
        >
          {side === "bottom" ? <div aria-hidden="true" className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-border-control" /> : null}
          <SheetPrimitive.Content className="sheet-content flex flex-1 flex-col gap-4 p-6">{children}</SheetPrimitive.Content>
          {showCloseButton ? (
            <SheetPrimitive.Close data-slot="sheet-close" render={<Button variant="ghost" size="icon" className="absolute top-3 right-3 size-8" />}>
              <svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="m4 4 8 8M12 4l-8 8" />
              </svg>
              <span className="sr-only">{l.close}</span>
            </SheetPrimitive.Close>
          ) : null}
        </SheetPrimitive.Popup>
      </SheetPrimitive.Viewport>
    </SheetPrimitive.Portal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sheet-header" className={cn("flex flex-col gap-1 pr-8", className)} {...props} />;
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sheet-footer" className={cn("mt-auto flex flex-col gap-2", className)} {...props} />;
}

function SheetTitle({ className, ...props }: WithClassName<SheetPrimitive.Title.Props>) {
  return <SheetPrimitive.Title data-slot="sheet-title" className={cn("text-title-3", className)} {...props} />;
}

function SheetDescription({ className, ...props }: WithClassName<SheetPrimitive.Description.Props>) {
  return <SheetPrimitive.Description data-slot="sheet-description" className={cn("text-callout text-muted-foreground", className)} {...props} />;
}

/**
 * Optional depth effect: wrap the app once in SheetProvider, put SheetIndentBackground behind and the page in
 * SheetIndent. The page recedes as any sheet opens and comes back as it is swiped away.
 */
function SheetProvider(props: SheetPrimitive.Provider.Props) {
  return <SheetPrimitive.Provider {...props} />;
}

function SheetIndentBackground({ className, ...props }: WithClassName<SheetPrimitive.IndentBackground.Props>) {
  return <SheetPrimitive.IndentBackground className={cn("fixed inset-0 -z-10 bg-scrim", className)} {...props} />;
}

function SheetIndent({ className, ...props }: WithClassName<SheetPrimitive.Indent.Props>) {
  return <SheetPrimitive.Indent className={cn("sheet-indent min-h-dvh bg-background", className)} {...props} />;
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetIndent,
  SheetIndentBackground,
  SheetProvider,
  SheetTitle,
  SheetTrigger,
};
