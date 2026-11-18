"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useMessages, type Messages } from "@/registry/aedis/lib/locale";

export type StepsLabels = Messages["steps"];
export type StepStatus = "done" | "current" | "upcoming";

export type StepProps = Omit<React.ComponentProps<"li">, "title"> & {
  status: StepStatus;
  title: React.ReactNode;
  /** One line after a done step's title, e.g. what was chosen in it. */
  summary?: React.ReactNode;
  /** A control after a done step's summary, e.g. a "Change" button that makes it current again. */
  action?: React.ReactNode;
  labels?: Partial<StepsLabels>;
  /** The current step's content, e.g. its form. Not rendered for done and upcoming steps. */
  children?: React.ReactNode;
};

/** A wizard's steps, numbered 01, 02… in order. */
function Steps({ className, ...props }: React.ComponentProps<"ol">) {
  // role="list": Safari drops the list role from a list without markers.
  return <ol role="list" data-slot="steps" className={cn("grid border-t border-hairline [counter-reset:step]", className)} {...props} />;
}

function Step({ status, title, summary, action, labels, className, children, ...props }: StepProps) {
  const l = useMessages("steps", labels);
  const heading = React.useRef<HTMLHeadingElement>(null);
  const was = React.useRef(status);
  React.useEffect(() => {
    // A step that becomes current (next, or reopened) takes focus, so keyboard and screen reader follow the wizard.
    if (status === "current" && was.current !== "current") heading.current?.focus();
    was.current = status;
  }, [status]);
  return (
    <li
      data-slot="step"
      data-status={status}
      aria-current={status === "current" ? "step" : undefined}
      className={cn("grid gap-x-8 gap-y-3 border-b border-hairline py-6 [counter-increment:step] sm:grid-cols-[4.5rem_minmax(0,1fr)]", className)}
      {...props}
    >
      {/* The number comes from a CSS counter; the list already tells assistive tech the position. */}
      <span
        aria-hidden="true"
        data-slot="step-number"
        className={cn(
          "w-fit border-t-2 pt-2 text-title-2 leading-none font-medium tabular-nums before:content-[counter(step,decimal-leading-zero)] sm:text-title-1",
          status === "current" ? "border-accent text-foreground" : "border-transparent text-muted-foreground",
        )}
      />
      <div className="grid min-w-0 gap-5">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-1">
          <h3 ref={heading} tabIndex={-1} className={cn("focus-ring rounded-xs text-headline font-semibold", status === "upcoming" && "font-medium text-muted-foreground")}>
            {title}
            {status === "current" ? null : <>{" "}<span className="sr-only">{l[status]}</span></>}
          </h3>
          {status === "done" && summary ? <p className="min-w-0 truncate text-callout text-muted-foreground">{summary}</p> : null}
          {status === "done" && action ? <div className="ms-auto">{action}</div> : null}
        </div>
        {status === "current" ? children : null}
      </div>
    </li>
  );
}

export { Step, Steps };
