"use client";

import * as React from "react";
import { useRender } from "@base-ui/react/use-render";

import { cn } from "@/lib/utils";
import { useMessages, type Messages } from "@/registry/aedis/lib/locale";
import { ExternalMark, linkProps } from "@/registry/aedis/ui/link";

export type BreadcrumbLabels = Messages["breadcrumb"];

function Breadcrumb({ labels, "aria-label": ariaLabel, ...props }: React.ComponentProps<"nav"> & { labels?: Partial<BreadcrumbLabels> }) {
  const l = useMessages("breadcrumb", labels);
  return <nav data-slot="breadcrumb" aria-label={ariaLabel ?? l.label} {...props} />;
}

function BreadcrumbList({ className, ...props }: React.ComponentProps<"ol">) {
  return <ol data-slot="breadcrumb-list" className={cn("flex flex-wrap items-center gap-1.5 text-callout break-words text-muted-foreground", className)} {...props} />;
}

function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li data-slot="breadcrumb-item" className={cn("inline-flex items-center gap-1.5", className)} {...props} />;
}

type BreadcrumbLinkProps = Omit<useRender.ComponentProps<"a">, "href"> & { href: string };

/** The href goes through safeUrl; pass `render` for a router link (it receives the safe href). */
function BreadcrumbLink({ className, href, render, children, ...props }: BreadcrumbLinkProps) {
  const link = linkProps(href);
  const element = useRender({
    defaultTagName: "a",
    render: link.href ? render : <span />,
    props: {
      "data-slot": "breadcrumb-link",
      className: cn("focus-ring rounded-xs transition-colors duration-(--duration-fast) ease-out hover:text-foreground", className),
      ...(link.href ? { href: link.href, rel: link.rel } : {}),
      ...props,
      children: (
        <>
          {children}
          {link.external ? <ExternalMark /> : null}
        </>
      ),
    },
  });
  return element;
}

function BreadcrumbPage({ className, ...props }: React.ComponentProps<"span">) {
  return <span data-slot="breadcrumb-page" aria-current="page" className={cn("text-foreground", className)} {...props} />;
}

function BreadcrumbSeparator({ children, className, ...props }: React.ComponentProps<"li">) {
  return (
    <li data-slot="breadcrumb-separator" role="presentation" aria-hidden="true" className={cn("[&>svg]:size-3.5", className)} {...props}>
      {children ?? (
        <svg viewBox="0 0 16 16" className="rtl:rotate-180" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="m6 4 4 4-4 4" />
        </svg>
      )}
    </li>
  );
}

function BreadcrumbEllipsis({ className, labels, ...props }: React.ComponentProps<"span"> & { labels?: Partial<BreadcrumbLabels> }) {
  const l = useMessages("breadcrumb", labels);
  return (
    <span data-slot="breadcrumb-ellipsis" className={cn("flex size-5 items-center justify-center", className)} {...props}>
      <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4" fill="currentColor">
        <circle cx="3.5" cy="8" r="1.2" />
        <circle cx="8" cy="8" r="1.2" />
        <circle cx="12.5" cy="8" r="1.2" />
      </svg>
      <span className="sr-only">{l.more}</span>
    </span>
  );
}

export { Breadcrumb, BreadcrumbEllipsis, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator };
