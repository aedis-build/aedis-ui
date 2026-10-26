"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useMessages, type Messages } from "@/registry/aedis/lib/locale";
import { Link } from "@/registry/aedis/ui/link";

export type SiteFooterLabels = Messages["siteFooter"];

export type SiteFooterProps = {
  links: { label: string; href: string }[];
  children?: React.ReactNode;
  labels?: Partial<SiteFooterLabels>;
  className?: string;
};

/** The bottom of a site: a labelled list of links (safeUrl, external marker, noopener) and notes such as the license. */
function SiteFooter({ links, children, labels, className }: SiteFooterProps) {
  const l = useMessages("siteFooter", labels);
  return (
    <footer data-slot="site-footer" className={cn("border-t border-border text-callout text-muted-foreground", className)}>
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 md:flex-row md:items-center md:justify-between">
        {links.length > 0 ? (
          <nav aria-label={l.label}>
            <ul className="flex flex-wrap gap-x-4 gap-y-2">
              {links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="focus-ring inline-flex min-h-6 items-center rounded-xs text-muted-foreground no-underline hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
        {children ? <div data-slot="site-footer-notes">{children}</div> : null}
      </div>
    </footer>
  );
}

export { SiteFooter };
