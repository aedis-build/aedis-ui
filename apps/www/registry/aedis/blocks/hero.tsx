import * as React from "react";

import { isExternal, safeUrl } from "@/lib/untrusted";
import { cn } from "@/lib/utils";
import { Button } from "@/registry/aedis/ui/button";

export type MarketingAction = { label: string; href: string; variant?: "default" | "outline" };

/** Links styled as buttons. Every href goes through safeUrl; an action whose URL is refused is left out. */
export function MarketingActions({ actions, className }: { actions: MarketingAction[]; className?: string }) {
  const safe = actions.map((a) => ({ ...a, url: safeUrl(a.href) })).filter((a) => a.url);
  if (!safe.length) return null;
  return (
    <div data-slot="marketing-actions" className={cn("flex flex-wrap gap-3", className)}>
      {safe.map((a) => (
        <Button key={a.label} size="lg" variant={a.variant ?? "default"} render={<a href={a.url} rel={isExternal(a.url) ? "noopener noreferrer" : undefined} />}>
          {a.label}
        </Button>
      ))}
    </div>
  );
}

export type HeroProps = {
  eyebrow?: string;
  headline: string;
  /** The end of the headline, on its own line in the theme's highlight colour. Part of the h1's text and name. */
  highlight?: string | undefined;
  lead?: string;
  actions?: MarketingAction[];
  /** e.g. a Slideshow or a background Video; it fills its side of the hero. */
  media?: React.ReactNode;
  className?: string;
};

/** The top of a marketing page: eyebrow, headline, lead and actions as real HTML, with an optional media slot. */
export function Hero({ eyebrow, headline, highlight, lead, actions = [], media, className }: HeroProps) {
  return (
    <section data-slot="hero" className={cn("grid items-center gap-8 px-6 py-12 md:grid-cols-2 md:px-10", className)}>
      <div className="flex flex-col gap-4">
        {eyebrow ? <p className="text-footnote font-semibold tracking-wide text-muted-foreground uppercase">{eyebrow}</p> : null}
        <h1 className="text-display text-balance">
          {headline}
          {highlight ? (
            <>
              {" "}
              <span data-slot="hero-highlight" className="block text-highlight">
                {highlight}
              </span>
            </>
          ) : null}
        </h1>
        {lead ? <p className="text-body text-muted-foreground">{lead}</p> : null}
        <MarketingActions actions={actions} className="pt-2" />
      </div>
      {media ? <div className="relative h-72 overflow-clip rounded-lg md:h-96">{media}</div> : null}
    </section>
  );
}
