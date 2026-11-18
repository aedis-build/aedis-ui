"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useFormat } from "@/registry/aedis/hooks/use-format";
import { useMessages, type Messages } from "@/registry/aedis/lib/locale";
import { Link } from "@/registry/aedis/ui/link";
import { Progress } from "@/registry/aedis/ui/progress";

export type StatLabels = Messages["stat"];

export type StatProps = Omit<React.ComponentProps<"div">, "children"> & {
  label: string;
  /** A number is formatted in the provider locale; a string shows as given. */
  value: number | string;
  /** Intl options for a number value, e.g. { style: "percent" }. */
  format?: Intl.NumberFormatOptions;
  /** Shows "of {total}" after the value and a bar of value / total. */
  total?: number;
  /** A change or a note under the value, e.g. "+4% from last month" or "Free plan". */
  delta?: React.ReactNode;
  /** A link under the value, e.g. to the page where the number is acted on. */
  action?: { href: string; label: string };
  labels?: Partial<StatLabels>;
};

/** One indicator: label, a large value, and an optional delta, total bar or link, read in that order. */
function Stat({ label, value, format, total, delta, action, labels, className, ...props }: StatProps) {
  const f = useFormat();
  const l = useMessages("stat", labels);
  const shown = typeof value === "number" ? f.number(value, format) : value;
  // A total of zero or less has no share to draw.
  const share = typeof value === "number" && total !== undefined && total > 0 ? (value / total) * 100 : undefined;
  return (
    <div data-slot="stat" className={cn("flex min-w-0 flex-col gap-1 py-4 pe-4", className)} {...props}>
      <dt className="text-footnote text-muted-foreground">{label}</dt>
      <dd className="text-title-1 tabular-nums">
        {shown}
        {total !== undefined ? (
          <span className="text-callout text-muted-foreground">
            {" "}
            {l.of.replace("{total}", () => f.number(total, format))}
          </span>
        ) : null}
      </dd>
      {delta ? <dd className="text-footnote text-muted-foreground">{delta}</dd> : null}
      {/* The bar repeats "value of total" for the eye; the text already says it. */}
      {share !== undefined ? (
        <dd aria-hidden="true" className="pt-1">
          <Progress value={share} />
        </dd>
      ) : null}
      {action ? (
        <dd>
          <Link href={action.href} className="inline-flex min-h-6 items-center text-footnote">
            {action.label}
          </Link>
        </dd>
      ) : null}
    </div>
  );
}

// Hairlines between stats as borders, so separators never reach assistive technology.
const row = cn(
  "grid-cols-2 *:border-border *:even:border-s *:even:ps-4 *:nth-[n+3]:border-t",
  "md:auto-cols-fr md:grid-flow-col md:grid-cols-none md:*:border-s md:*:ps-4 md:*:first:border-s-0 md:*:first:ps-0 md:*:nth-[n+3]:border-t-0",
);
const column = "grid-cols-1 *:border-border *:not-first:border-t";

export type StatGroupProps = React.ComponentProps<"dl"> & {
  /** One stat per row at every width. */
  stack?: boolean;
};

/** A row of stats under a 1 px ink rule, with hairlines between them; two columns on a phone. */
function StatGroup({ stack = false, className, ...props }: StatGroupProps) {
  return <dl data-slot="stat-group" className={cn("grid border-t border-foreground", stack ? column : row, className)} {...props} />;
}

export { Stat, StatGroup };
