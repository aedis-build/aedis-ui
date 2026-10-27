"use client";

import * as React from "react";

import { isExternal, safeUrl } from "@/lib/untrusted";
import { cn } from "@/lib/utils";
import { useMessages, type Messages } from "@/registry/aedis/lib/locale";

export type LinkLabels = Messages["link"];

/**
 * The attributes of a link to an untrusted or configured URL: only safe protocols survive, and external links never
 * get access to this page (`noopener noreferrer`). `href` is null when the URL was refused.
 */
export function linkProps(href: string) {
  const url = safeUrl(href);
  const external = url !== "" && isExternal(url);
  return { href: url || null, external, rel: external ? "noopener noreferrer" : undefined };
}

/** Visible arrow plus screen-reader text, so people know a link leaves the site before they follow it. */
function ExternalMark({ labels }: { labels?: Partial<LinkLabels> }) {
  const l = useMessages("link", labels);
  return (
    <>
      {" "}
      <svg data-slot="external-mark" viewBox="0 0 16 16" aria-hidden="true" className="inline size-3 shrink-0 align-[-0.05em]" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M6 3.5h6.5V10M12.5 3.5 4 12" />
      </svg>
      <span className="sr-only">{l.external}</span>
    </>
  );
}

export type LinkProps = Omit<React.ComponentProps<"a">, "href"> & { href: string; labels?: Partial<LinkLabels> };

/** An anchor for a URL that may be untrusted. A refused URL renders its text without a link. */
function Link({ href, children, className, labels, ...props }: LinkProps) {
  const link = linkProps(href);
  if (!link.href) return <span className={className}>{children}</span>;
  return (
    <a data-slot="link" href={link.href} rel={link.rel} className={cn("focus-ring rounded-xs text-link underline underline-offset-4", className)} {...props}>
      {children}
      {link.external ? <ExternalMark labels={labels} /> : null}
    </a>
  );
}

export { ExternalMark, Link };
