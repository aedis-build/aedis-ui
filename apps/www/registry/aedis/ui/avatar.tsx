"use client";

import * as React from "react";
import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar";

import { cn, type WithClassName } from "@/lib/utils";

function Avatar({ className, ...props }: WithClassName<AvatarPrimitive.Root.Props>) {
  return <AvatarPrimitive.Root data-slot="avatar" className={cn("relative flex size-8 shrink-0 overflow-hidden rounded-full", className)} {...props} />;
}

function AvatarImage({ className, ...props }: WithClassName<AvatarPrimitive.Image.Props>) {
  return <AvatarPrimitive.Image data-slot="avatar-image" className={cn("aspect-square size-full", className)} {...props} />;
}

/** Initials. A longer text shows its first two characters, which fit the circle, and is read in full. */
function AvatarFallback({ className, children, ...props }: WithClassName<AvatarPrimitive.Fallback.Props>) {
  const chars = typeof children === "string" ? [...children] : null;
  return (
    <AvatarPrimitive.Fallback data-slot="avatar-fallback" className={cn("flex size-full items-center justify-center rounded-full bg-muted text-caption", className)} {...props}>
      {chars && chars.length > 2 ? (
        <>
          <span aria-hidden="true">{chars.slice(0, 2).join("")}</span>
          <span className="sr-only">{children}</span>
        </>
      ) : (
        children
      )}
    </AvatarPrimitive.Fallback>
  );
}

export { Avatar, AvatarFallback, AvatarImage };
