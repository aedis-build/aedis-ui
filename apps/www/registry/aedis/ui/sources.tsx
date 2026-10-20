"use client";

import * as React from "react";

import { stripInvisible } from "@/lib/untrusted";
import { cn } from "@/lib/utils";
import { useMessages, type Messages } from "@/registry/aedis/lib/locale";
import { ExternalMark, linkProps } from "@/registry/aedis/ui/link";

export type SourcesLabels = Messages["sources"];

export type Source = {
  /** Shown as text. */
  title: string;
  url: string;
  /** A short quote from the document, shown as text. */
  snippet?: string;
};

/**
 * The domain a person will land on. URL.hostname is punycode for international names, so a lookalike domain shows
 * as xn--… instead of passing for the real one.
 */
export function sourceDomain(url: string): string | null {
  const href = linkProps(url).href;
  if (!href) return null;
  try {
    const { hostname } = new URL(href, "https://relative.invalid");
    return hostname === "relative.invalid" ? null : hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

const anchor = (prefix: string, n: number) => `${prefix}-${n}`;

/** Numbered list of the documents an answer is grounded in. No favicon is ever fetched (privacy and img-src). */
function Sources({ sources, idPrefix, labels, className }: { sources: Source[]; idPrefix?: string; labels?: Partial<SourcesLabels>; className?: string }) {
  const l = useMessages("sources", labels);
  const generated = React.useId();
  const prefix = idPrefix ?? `source${generated.replace(/:/g, "")}`;
  const headingId = `${prefix}-heading`;
  return (
    <section data-slot="sources" aria-labelledby={headingId} className={cn("space-y-2 text-callout", className)}>
      <h3 id={headingId} className="text-caption uppercase text-muted-foreground">{l.title}</h3>
      <ol className="space-y-2">
        {sources.map((s, i) => {
          const link = linkProps(s.url);
          const domain = sourceDomain(s.url);
          const title = stripInvisible(s.title);
          return (
            <li key={i} id={anchor(prefix, i + 1)} className="flex gap-3 rounded-sm border border-hairline bg-surface px-3 py-2">
              <span aria-hidden="true" className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-xs bg-muted text-caption text-muted-foreground">{i + 1}</span>
              <div className="min-w-0 flex-1 space-y-0.5">
                {link.href ? (
                  <a href={link.href} rel={link.rel} target={link.external ? "_blank" : undefined} className="focus-ring rounded-xs font-medium text-link underline underline-offset-4 break-words">
                    {title}
                    {link.external ? <ExternalMark /> : null}
                  </a>
                ) : (
                  <span className="font-medium break-words">{title}</span>
                )}
                {domain ? <p className="font-mono text-footnote text-muted-foreground">{domain}</p> : null}
                {s.snippet ? <p className="line-clamp-2 text-footnote text-muted-foreground">{stripInvisible(s.snippet)}</p> : null}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** An inline marker that jumps to its entry in <Sources idPrefix=…>. */
function Citation({ n, title, idPrefix, labels }: { n: number; title?: string; idPrefix: string; labels?: Partial<SourcesLabels> }) {
  const l = useMessages("sources", labels);
  const name = `${l.source} ${n}${title ? `: ${stripInvisible(title)}` : ""}`;
  return (
    <sup data-slot="citation">
      <a href={`#${anchor(idPrefix, n)}`} aria-label={name} title={name} className="focus-ring ml-0.5 rounded-xs px-0.5 text-caption text-link no-underline hover:underline">
        [{n}]
      </a>
    </sup>
  );
}

export { Citation, Sources };
