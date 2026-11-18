"use client";

import * as React from "react";

import { isExternal, safeUrl } from "@/lib/untrusted";
import { cn } from "@/lib/utils";
import { useFormat } from "@/registry/aedis/hooks/use-format";
import { useMessages, type Messages } from "@/registry/aedis/lib/locale";
import { Button } from "@/registry/aedis/ui/button";

/** What a plan's action does: a link (through safeUrl) with an href, or a button with onClick. Name it in full: "Switch to Pro". */
export type PlanAction = { label: string } & ({ href: string; onClick?: never } | { onClick: () => void; href?: never });

export type Plan = {
  id: string;
  name: string;
  /** An amount in `currency`, or text for a price with no number ("Talk to us"). */
  price: number | string;
  /** After the price, e.g. "per month". */
  period?: string;
  items?: string[];
  action?: PlanAction;
};

export type PlansProps = {
  plans: Plan[];
  /** The id of the plan the account is on. */
  current?: string | undefined;
  /** ISO 4217 code, e.g. "BRL" or "USD". */
  currency: string;
  /** BCP 47 tag for the amounts, e.g. "pt-BR". Defaults to the Locale provider's. */
  locale?: string | undefined;
  /** A visible heading over the columns; the plans' headings then sit one level under it. */
  title?: string | undefined;
  labels?: Partial<Messages["plans"]>;
  className?: string;
};

/**
 * Pricing columns on one grid (5, 2 on tablet, 1 on phone). The current plan is marked by an accent rule drawn as an
 * inset shadow and a tag in a title row of fixed height, so no column moves by a pixel.
 */
export function Plans({ plans, current, currency, locale, title, labels, className }: PlansProps) {
  const l = useMessages("plans", labels);
  const f = useFormat();
  const H = title ? "h3" : "h2";
  const uid = React.useId();
  return (
    <div data-slot="plans" className={cn("flex flex-col gap-6", className)}>
      {title ? <h2 className="text-title-2">{title}</h2> : null}
      <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-5">
        {plans.map((p) => {
          const on = p.id === current;
          const url = p.action?.href ? safeUrl(p.action.href) : undefined;
          return (
            <section
              key={p.id}
              aria-labelledby={`${uid}-${p.id}`}
              data-current={on || undefined}
              // Rules as inset shadows, never borders: the accent one is thicker and still takes no space.
              className={cn("flex flex-col gap-4 pt-4", on ? "shadow-[inset_0_2px_0_var(--accent)]" : "shadow-[inset_0_1px_0_var(--hairline)]")}
            >
              <div data-slot="plan-title" className="flex h-7 items-center justify-between gap-2">
                <H id={`${uid}-${p.id}`} className="text-headline">
                  {p.name}
                </H>
                {on ? <span className="text-footnote font-medium text-highlight">{l.current}</span> : null}
              </div>
              <p className="flex items-baseline gap-1">
                <span className="text-title-2 tabular-nums">{typeof p.price === "number" ? f.currency(p.price, currency, { locale, trailingZeroDisplay: "stripIfInteger" }) : p.price}</span>
                {p.period ? (
                  <>
                    {" "}
                    <span className="text-footnote text-muted-foreground">{p.period}</span>
                  </>
                ) : null}
              </p>
              {p.items?.length ? (
                <ul className="flex flex-col gap-2 text-callout text-muted-foreground">
                  {p.items.map((item) => (
                    <li key={item} className="flex gap-2 before:shrink-0 before:content-['–']">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}
              {/* The action row is reserved in every plan, so a column is as tall whether it is current or not. */}
              <div data-slot="plan-action" className="mt-auto flex h-9 items-center">
                {p.action && (url || !p.action.href) ? (
                  <Button
                    variant="outline"
                    {...(url ? { render: <a href={url} rel={isExternal(url) ? "noopener noreferrer" : undefined} /> } : { onClick: p.action.onClick })}
                  >
                    {p.action.label}
                  </Button>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
