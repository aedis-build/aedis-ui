"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useMessages } from "@/registry/aedis/lib/locale";
import { Link } from "@/registry/aedis/ui/link";

/**
 * A client: its name always; a logo image on this origin (or one the CSP img-src allows) and a link when given. Give the
 * logo's width and height, so the row keeps its layout while it loads.
 */
export type Client = { name: string; logo?: string; href?: string; width?: number | undefined; height?: number | undefined };

export type LogoCloudProps = {
  /** A visible heading. Without one the list is named by `label`, or the Locale provider's "Clients". */
  title?: string | undefined;
  label?: string | undefined;
  clients: Client[];
  /** grid: a grid of logos. row: one line split by hairline dividers, wrapping with no divider at a line's start. */
  variant?: "grid" | "row" | undefined;
  className?: string;
};

/** The clients a studio has worked with, as logos or names. Links go through the safe Link. */
export function LogoCloud({ title, label, clients, variant = "grid", className }: LogoCloudProps) {
  const l = useMessages("logoCloud", label ? { label } : undefined);
  const heading = React.useId();
  const row = variant === "row";
  const list = (
    <ul
      data-variant={variant}
      // A row: every logo but the first carries a divider on its left. Wrapped, the list fills the clipping box from 1 px
      // left of it, so the divider of whichever logo opens a later line is cut off: no orphan, and none after the last.
      className={cn(row ? "-ml-px flex w-fit max-w-[calc(100%+1px)] flex-wrap items-center gap-y-4 [&>li]:border-l [&>li]:border-hairline [&>li]:px-6 [&>li:first-child]:border-l-0" : "grid grid-cols-2 items-center gap-6 sm:grid-cols-3 lg:grid-cols-6")}
    >
      {clients.map((c) => {
        const mark = c.logo ? (
          <img src={c.logo} alt={c.name} width={c.width} height={c.height ?? 32} className="mx-auto h-8 w-auto object-contain opacity-80" />
        ) : (
          <span className="text-headline">{c.name}</span>
        );
        return (
          <li key={c.name} className="text-center text-muted-foreground">
            {c.href ? <Link href={c.href} className="text-current no-underline">{mark}</Link> : mark}
          </li>
        );
      })}
    </ul>
  );
  return (
    <section data-slot="logo-cloud" aria-labelledby={title ? heading : undefined} aria-label={title ? undefined : l.label} className={cn("flex flex-col gap-6 px-6 py-10", className)}>
      {title ? (
        <h2 id={heading} className="text-center text-footnote font-semibold tracking-wide text-muted-foreground uppercase">
          {title}
        </h2>
      ) : null}
      {row ? <div className="flex justify-center overflow-hidden">{list}</div> : list}
    </section>
  );
}
