"use client";

import * as React from "react";
import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog";

import { cn, type WithClassName } from "@/lib/utils";
import { Button } from "@/registry/aedis/ui/button";

/**
 * Confirmation for actions that cannot be undone or that leave the company (send, approve, delete).
 * Focus starts on Cancel, so pressing Enter right after opening never confirms.
 */
function AlertDialog(props: AlertDialogPrimitive.Root.Props) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />;
}

function AlertDialogTrigger(props: AlertDialogPrimitive.Trigger.Props) {
  return <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />;
}

function AlertDialogContent({ className, initialFocus, ...props }: WithClassName<AlertDialogPrimitive.Popup.Props>) {
  const popup = React.useRef<HTMLDivElement>(null);
  // Cancel wins wherever it sits in the footer; without one, Base UI's default (first tabbable) applies.
  const focusCancel = () => popup.current?.querySelector<HTMLElement>("[data-slot=alert-dialog-cancel]") ?? true;
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Backdrop
        data-slot="alert-dialog-overlay"
        className="fixed inset-0 z-50 bg-black/50 transition-opacity duration-150 data-starting-style:opacity-0 data-ending-style:opacity-0 motion-reduce:transition-none"
      />
      <AlertDialogPrimitive.Popup
        ref={popup}
        data-slot="alert-dialog-content"
        initialFocus={initialFocus ?? focusCancel}
        className={cn(
          "fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl border border-border bg-background p-6 shadow-lg outline-none transition-[opacity,scale] duration-150 data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0 motion-reduce:transition-none sm:max-w-lg",
          className,
        )}
        {...props}
      />
    </AlertDialogPrimitive.Portal>
  );
}

function AlertDialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="alert-dialog-header" className={cn("flex flex-col gap-1.5", className)} {...props} />;
}

function AlertDialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="alert-dialog-footer" className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />;
}

function AlertDialogTitle({ className, ...props }: WithClassName<AlertDialogPrimitive.Title.Props>) {
  return <AlertDialogPrimitive.Title data-slot="alert-dialog-title" className={cn("text-lg font-semibold", className)} {...props} />;
}

function AlertDialogDescription({ className, ...props }: WithClassName<AlertDialogPrimitive.Description.Props>) {
  return <AlertDialogPrimitive.Description data-slot="alert-dialog-description" className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

/** Confirms and closes the dialog. */
function AlertDialogAction({ className, ...props }: WithClassName<AlertDialogPrimitive.Close.Props>) {
  return <AlertDialogPrimitive.Close data-slot="alert-dialog-action" render={<Button className={className} />} {...props} />;
}

function AlertDialogCancel({ className, ...props }: WithClassName<AlertDialogPrimitive.Close.Props>) {
  return <AlertDialogPrimitive.Close data-slot="alert-dialog-cancel" render={<Button variant="outline" className={className} />} {...props} />;
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
};
