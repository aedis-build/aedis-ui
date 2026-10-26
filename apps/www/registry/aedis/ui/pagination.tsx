"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useMessages, type Messages } from "@/registry/aedis/lib/locale";
import { buttonVariants } from "@/registry/aedis/ui/button";
import { linkProps } from "@/registry/aedis/ui/link";

export type PaginationLabels = Messages["pagination"];

function Pagination({ className, labels, "aria-label": ariaLabel, ...props }: React.ComponentProps<"nav"> & { labels?: Partial<PaginationLabels> }) {
  const l = useMessages("pagination", labels);
  return <nav data-slot="pagination" aria-label={ariaLabel ?? l.label} className={cn("mx-auto flex w-full justify-center", className)} {...props} />;
}

function PaginationContent({ className, ...props }: React.ComponentProps<"ul">) {
  return <ul data-slot="pagination-content" className={cn("flex flex-wrap items-center justify-center gap-1", className)} {...props} />;
}

function PaginationItem(props: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />;
}

type PaginationLinkProps = Omit<React.ComponentProps<"a">, "href"> & {
  href: string;
  isActive?: boolean;
  size?: "default" | "icon";
  /** Shown but not a link, e.g. Previous on the first page. */
  disabled?: boolean;
};

/** The href goes through safeUrl; a refused URL, or `disabled`, renders a disabled page. */
function PaginationLink({ className, href, isActive, size = "icon", disabled, children, ...props }: PaginationLinkProps) {
  const link = linkProps(href);
  const classes = cn(buttonVariants({ variant: isActive ? "outline" : "ghost", size }), "min-w-9 tabular-nums", className);
  if (disabled || !link.href) {
    return (
      <span data-slot="pagination-link" aria-disabled="true" className={cn(classes, "pointer-events-none opacity-50")}>
        {children}
        {/* Previous and Next hide their text on phones; a disabled end keeps its name as text. */}
        {props["aria-label"] ? <span className="sr-only">{props["aria-label"]}</span> : null}
      </span>
    );
  }
  return (
    <a data-slot="pagination-link" href={link.href} rel={link.rel} aria-current={isActive ? "page" : undefined} data-active={isActive || undefined} className={classes} {...props}>
      {children}
    </a>
  );
}

const arrow = (d: string) => (
  <svg viewBox="0 0 16 16" aria-hidden="true" className="rtl:rotate-180" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d={d} />
  </svg>
);

function PaginationPrevious({ labels, ...props }: Omit<PaginationLinkProps, "size"> & { labels?: Partial<PaginationLabels> }) {
  const l = useMessages("pagination", labels);
  return (
    <PaginationLink aria-label={l.goPrevious} size="default" className="gap-1 pl-2.5" {...props}>
      {arrow("m10 4-4 4 4 4")}
      <span className="hidden sm:block">{l.previous}</span>
    </PaginationLink>
  );
}

function PaginationNext({ labels, ...props }: Omit<PaginationLinkProps, "size"> & { labels?: Partial<PaginationLabels> }) {
  const l = useMessages("pagination", labels);
  return (
    <PaginationLink aria-label={l.goNext} size="default" className="gap-1 pr-2.5" {...props}>
      <span className="hidden sm:block">{l.next}</span>
      {arrow("m6 4 4 4-4 4")}
    </PaginationLink>
  );
}

function PaginationEllipsis({ className, labels, ...props }: React.ComponentProps<"span"> & { labels?: Partial<PaginationLabels> }) {
  const l = useMessages("pagination", labels);
  return (
    <span data-slot="pagination-ellipsis" className={cn("flex size-9 items-center justify-center text-muted-foreground", className)} {...props}>
      <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4" fill="currentColor">
        <circle cx="3.5" cy="8" r="1.2" />
        <circle cx="8" cy="8" r="1.2" />
        <circle cx="12.5" cy="8" r="1.2" />
      </svg>
      <span className="sr-only">{l.more}</span>
    </span>
  );
}

export { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious };
