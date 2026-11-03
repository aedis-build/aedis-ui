"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/registry/aedis/hooks/use-reduced-motion";
import { useMessages, type Messages } from "@/registry/aedis/lib/locale";
import { Link } from "@/registry/aedis/ui/link";

export type SiteFooterLabels = Messages["siteFooter"];

export type SiteFooterProps = {
  links: { label: string; href: string }[];
  children?: React.ReactNode;
  labels?: Partial<SiteFooterLabels>;
  className?: string;
  /**
   * Curtain mode: the page lifts off and uncovers the footer, which waits behind it, stuck to the bottom. The content
   * before it must be opaque and stacked higher (position relative, a z-index, a background). Under reduced motion,
   * and when the footer is taller than its viewport, it is a normal footer.
   */
  reveal?: boolean | undefined;
  /** Drawn behind the footer's content, and hidden from assistive technology: a slow sign, a masked wordmark. */
  backdrop?: React.ReactNode;
  /** A closing statement and its action, above the links. */
  closing?: React.ReactNode;
  /** The credit row: copyright on the left, an image credit on the right, a maker's line centred below. */
  credits?: { left?: React.ReactNode; right?: React.ReactNode; center?: React.ReactNode } | undefined;
};

/** The nearest scrolling ancestor's height, or the viewport's: what the footer must fit in to be revealed. */
function scrollportHeight(el: HTMLElement) {
  for (let p = el.parentElement; p; p = p.parentElement) {
    if (/(auto|scroll)/.test(getComputedStyle(p).overflowY)) return p.clientHeight;
  }
  return window.innerHeight;
}

/** Scrolls the footer's viewport to the end, so the curtain is fully open. */
function uncover(footer: HTMLElement) {
  for (let p = footer.parentElement; p; p = p.parentElement) {
    if (/(auto|scroll)/.test(getComputedStyle(p).overflowY)) return void (p.scrollTop = p.scrollHeight);
  }
  window.scrollTo(0, document.documentElement.scrollHeight);
}

/** Development only: says so when the content before a revealed footer would let it show through. */
function checkStacking(footer: HTMLElement) {
  const above = footer.previousElementSibling as HTMLElement | null;
  if (!above) return;
  const s = getComputedStyle(above);
  const z = Number.parseInt(s.zIndex, 10);
  const opaque = /^rgb\(/.test(s.backgroundColor) || s.backgroundImage !== "none";
  if (s.position === "static" || !(z > 0) || !opaque)
    console.warn("SiteFooter reveal: the element before the footer needs position relative, a z-index above 0 and an opaque background, or the footer shows through it.");
}

/**
 * The bottom of a site: a labelled list of links (safeUrl, external marker, noopener), notes such as the license, and
 * optionally a closing statement, a credit row and a decorative backdrop. With `reveal` it is uncovered like a curtain
 * as the page scrolls off it; its content stays in the DOM after the page, reachable by keyboard while covered.
 */
function SiteFooter({ links, children, labels, className, reveal = false, backdrop, closing, credits }: SiteFooterProps) {
  const l = useMessages("siteFooter", labels);
  const reduced = useReducedMotion();
  const ref = React.useRef<HTMLElement>(null);
  const [fits, setFits] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || !reveal || reduced) return setFits(false);
    const measure = () => setFits(el.offsetHeight <= scrollportHeight(el));
    measure();
    if (process.env.NODE_ENV !== "production") checkStacking(el);
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [reveal, reduced]);

  const curtain = reveal && fits && !reduced;
  const rich = Boolean(backdrop || closing || credits);
  return (
    <footer
      ref={ref}
      data-slot="site-footer"
      data-reveal={curtain || undefined}
      // Focus that lands in a covered footer would be hidden under the page (WCAG 2.4.11): uncover it first.
      onFocus={curtain ? (e) => uncover(e.currentTarget) : undefined}
      className={cn(
        "relative text-callout text-muted-foreground",
        rich ? "isolate overflow-hidden bg-background" : "border-t border-border",
        curtain && "sticky bottom-0 z-0",
        className,
      )}
    >
      {backdrop ? (
        <div aria-hidden="true" data-slot="site-footer-backdrop" className="pointer-events-none absolute inset-0 -z-10">
          {backdrop}
        </div>
      ) : null}
      <div className={cn("mx-auto flex max-w-6xl flex-col gap-4 px-4", rich ? "min-h-[inherit] justify-between gap-12 py-12" : "py-8 md:flex-row md:items-center md:justify-between")}>
        {closing ? <div data-slot="site-footer-closing" className="text-foreground">{closing}</div> : null}
        <div className={cn("flex flex-col gap-4", rich && "md:flex-row md:items-center md:justify-between")}>
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
        {credits ? (
          <div data-slot="site-footer-credits" className="grid gap-3 border-t border-border pt-4 text-footnote md:grid-cols-2">
            {credits.left ? <div>{credits.left}</div> : null}
            {credits.right ? <div className="md:text-right">{credits.right}</div> : null}
            {credits.center ? <div className="md:col-span-2 md:text-center">{credits.center}</div> : null}
          </div>
        ) : null}
      </div>
    </footer>
  );
}

export { SiteFooter };
