"use client";

import * as React from "react";

import { useReducedMotion } from "@/registry/aedis/hooks/use-reduced-motion";
import { animateOnScroll, useScrollEffect, watchScroll } from "@/registry/aedis/ui/scroll-motion";
import { cn } from "@/lib/utils";

export type ScrollStep = { title: React.ReactNode; meta?: React.ReactNode; text?: React.ReactNode; icon?: React.ReactNode };

type ScrollStepsProps = Omit<React.ComponentProps<"div">, "children"> & {
  items: ScrollStep[];
  /** The reading point, as a share of the viewport height from the top: a step is done once its node passes it. */
  head?: number | undefined;
  /** A closing node and its content, after the steps, e.g. how to hire. */
  end?: { title: React.ReactNode; icon?: React.ReactNode; children?: React.ReactNode } | undefined;
};

// The node is size-7: its centre is 14 px below the top of its row.
const NODE = 28;

const Clock = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <circle cx="8" cy="8" r="5.5" />
    <path d="M8 5v3l2 1.5" />
  </svg>
);
const Check = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3.5 8.5l3 3 6-7" />
  </svg>
);

function Node({ icon }: { icon?: React.ReactNode | undefined }) {
  return (
    <span
      aria-hidden="true"
      data-slot="scroll-step-node"
      className="relative z-10 grid size-7 place-items-center rounded-full border-2 border-border-control bg-surface text-muted-foreground transition-colors duration-(--duration-fast) group-data-[state=done]:border-accent group-data-[state=done]:bg-accent group-data-[state=done]:text-accent-foreground motion-reduce:transition-none [&_svg]:size-3.5"
    >
      {icon ?? (
        <>
          <span className="absolute transition-opacity duration-(--duration-fast) group-data-[state=done]:opacity-0 motion-reduce:transition-none">
            <Clock />
          </span>
          <span className="absolute opacity-0 transition-opacity duration-(--duration-fast) group-data-[state=done]:opacity-100 motion-reduce:transition-none">
            <Check />
          </span>
        </>
      )}
    </span>
  );
}

/**
 * A list of steps on a line that fills as the reader scrolls. The line's end and every node answer to the same reading
 * head, so a step turns done exactly when the line reaches its node. The line runs on the scroll primitive (native or
 * its JavaScript fallback); each step's data-state is pending or done. Server, no JavaScript and reduced motion: done.
 */
function ScrollSteps({ items, head = 0.55, end, className, ...props }: ScrollStepsProps) {
  const reduced = useReducedMotion();
  const list = React.useRef<HTMLOListElement>(null);
  const track = React.useRef<HTMLDivElement>(null);
  const fill = React.useRef<HTMLDivElement>(null);
  const [done, setDone] = React.useState<boolean[] | null>(null);
  const count = items.length + (end ? 1 : 0);
  // Rounded: 0.55 would otherwise come out as 44.99999999999999svh.
  const pct = (share: number) => Math.round(share * 1e4) / 100;
  const below = `${pct(1 - head)}svh` as const;

  // The line runs from the first node's centre to the last one's: measured, since the rows are as tall as their text.
  React.useLayoutEffect(() => {
    const ol = list.current;
    const line = track.current;
    if (!ol || !line) return;
    const place = () => {
      const nodes = ol.querySelectorAll<HTMLElement>("[data-slot=scroll-step-node]");
      const [first, last] = [nodes[0], nodes[nodes.length - 1]];
      if (!first || !last) return;
      const top = first.getBoundingClientRect().top - ol.getBoundingClientRect().top + NODE / 2;
      line.style.top = `${top}px`;
      line.style.height = `${last.getBoundingClientRect().top - first.getBoundingClientRect().top}px`;
    };
    place();
    const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(place);
    observer?.observe(ol);
    return () => observer?.disconnect();
  }, [count]);

  // The fill reaches the head as the line's top passes it, and the line's bottom when that does: scaleY 0 → 1.
  useScrollEffect(
    fill,
    (el, fallback) => animateOnScroll(el, [{ transform: "scaleY(0)" }, { transform: "scaleY(1)" }], { subject: track.current ?? el, range: { start: ["cover", below], end: ["cover", `calc(100% - ${pct(head)}svh)`] }, fallback, inset: "none" }),
    [below, head, count],
  );

  // A node is done once its centre is above the head: one step of the shared scroll loop per node.
  React.useEffect(() => {
    const ol = list.current;
    if (!ol || reduced) return setDone(null);
    const nodes = [...ol.querySelectorAll<HTMLElement>("[data-slot=scroll-step-node]")];
    const state = nodes.map(() => false);
    const at = ["cover", `calc(${below} + ${NODE / 2}px)`] as const;
    const stops = nodes.map((node, i) =>
      watchScroll(node, { start: at, end: at }, (p) => {
        if (state[i] === p >= 1) return;
        state[i] = p >= 1;
        setDone([...state]);
      }),
    );
    setDone([...state]);
    return () => stops.forEach((stop) => stop());
  }, [reduced, below, count]);

  const stateOf = (i: number) => (done === null || done[i] ? "done" : "pending");
  return (
    <div data-slot="scroll-steps" className={cn("relative", className)} {...props}>
      <div ref={track} aria-hidden="true" data-slot="scroll-steps-line" className="absolute left-3.5 w-0.5 -translate-x-1/2 rounded-full bg-border">
        <div ref={fill} className="size-full origin-top rounded-full bg-accent" />
      </div>
      <ol ref={list} className="relative grid gap-10">
        {items.map((item, i) => (
          <li key={i} data-state={stateOf(i)} className="group grid grid-cols-[1.75rem_1fr] gap-4">
            <Node icon={item.icon} />
            <div className="grid gap-1">
              {item.meta ? <p className="text-footnote text-muted-foreground">{item.meta}</p> : null}
              <p className="text-headline">{item.title}</p>
              {item.text ? <div className="text-callout text-muted-foreground">{item.text}</div> : null}
            </div>
          </li>
        ))}
        {end ? (
          <li data-state={stateOf(items.length)} data-end="" className="group grid grid-cols-[1.75rem_1fr] gap-4">
            <Node icon={end.icon} />
            <div className="grid gap-3">
              <p className="text-headline">{end.title}</p>
              {end.children}
            </div>
          </li>
        ) : null}
      </ol>
    </div>
  );
}

export { ScrollSteps };
