"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useMessages, type Messages } from "@/registry/aedis/lib/locale";

/** A numbered fact under the statement: a short title and an optional line of detail. */
export type AuthFact = { title: string; detail?: string };

export type AuthSplitProps = Omit<React.ComponentProps<"form">, "title" | "className"> & {
  /** The product mark, at the top of the statement column. */
  mark?: React.ReactNode;
  statement: string;
  /** Shown instead of the statement on a phone, where the column is reduced to the mark and one short line. */
  shortStatement?: string;
  /** Numbered facts under a rule; left out on a phone so the form comes right after the statement. */
  facts?: AuthFact[];
  /** The page's h1, at the top of the form column; it also names the form. */
  title: string;
  lead?: React.ReactNode;
  /** Links under the form (switch to sign up, help); each gets a 44 px target. */
  footer?: React.ReactNode;
  className?: string;
};

/**
 * Sign in and sign up as one split screen: the mark, a statement and numbered facts on the left; the form on the right,
 * 480 px wide on a wide screen. Both pages share one minimum height (44rem; override with className), so the divider
 * never moves between them. The form is a real <form>: Enter submits it, it posts unless told otherwise, so a submit
 * before hydration never puts the email in the URL, and its fields, handlers and action come in as props.
 */
export function AuthSplit({ mark, statement, shortStatement, facts, title, lead, footer, className, children, ...form }: AuthSplitProps) {
  const heading = React.useId();
  return (
    <div data-slot="auth-split" className={cn("grid lg:min-h-[44rem] lg:grid-cols-[minmax(0,1fr)_480px]", className)}>
      <div data-slot="auth-split-aside" className="flex flex-col gap-4 px-6 pt-8 pb-6 lg:justify-between lg:gap-12 lg:border-r lg:border-hairline lg:p-12">
        {mark ? <div data-slot="auth-split-mark">{mark}</div> : null}
        <p className={cn("max-w-[20ch] text-title-2 text-balance lg:text-display", shortStatement && "hidden lg:block")}>{statement}</p>
        {shortStatement ? <p className="text-title-3 text-balance lg:hidden">{shortStatement}</p> : null}
        {facts?.length ? (
          <ol data-slot="auth-split-facts" className="hidden gap-6 border-t border-hairline pt-6 lg:grid lg:grid-cols-3">
            {facts.map((f, i) => (
              <li key={f.title} className="flex flex-col gap-1">
                {/* The list already numbers the facts for assistive technology; this is the visible numeral. */}
                <span aria-hidden="true" className="text-footnote text-muted-foreground tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-callout font-medium">{f.title}</span>
                {f.detail ? <span className="text-footnote text-muted-foreground">{f.detail}</span> : null}
              </li>
            ))}
          </ol>
        ) : null}
      </div>
      <div data-slot="auth-split-main" className="flex flex-col gap-6 px-6 pb-8 lg:justify-center lg:p-12">
        <div className="flex flex-col gap-2">
          <h1 id={heading} className="text-title-2">
            {title}
          </h1>
          {lead ? <p className="text-callout text-muted-foreground">{lead}</p> : null}
        </div>
        <form method="post" data-slot="auth-split-form" aria-labelledby={heading} className="flex flex-col gap-4" {...form}>
          {children}
        </form>
        {footer ? (
          <div
            data-slot="auth-split-footer"
            className="flex flex-wrap items-center gap-x-4 text-footnote text-muted-foreground [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center [&_button]:min-h-11"
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** The "or" between the provider buttons and the email field. */
export function AuthSplitDivider({ labels }: { labels?: Partial<Messages["authSplit"]> }) {
  const l = useMessages("authSplit", labels);
  return (
    <div data-slot="auth-split-divider" className="flex items-center gap-3 text-footnote text-muted-foreground">
      <span aria-hidden="true" className="flex-1 border-t border-hairline" />
      {l.or}
      <span aria-hidden="true" className="flex-1 border-t border-hairline" />
    </div>
  );
}
