"use client";

import * as React from "react";

import { useReducedMotion } from "@/registry/aedis/hooks/use-reduced-motion";
import { useMessages, type Messages } from "@/registry/aedis/lib/locale";
import { cn } from "@/lib/utils";

export type MarqueeProps = {
  /** The words or logos, in order. Children are used when there are no items. */
  items?: React.ReactNode[] | undefined;
  children?: React.ReactNode;
  /** Seconds for one full loop. */
  speed?: number | undefined;
  direction?: "left" | "right" | undefined;
  /** Two lines run in opposite directions; the second one is a copy, hidden from screen readers. */
  lines?: 1 | 2 | undefined;
  /** Space between items, any CSS length. */
  gap?: string | undefined;
  /**
   * sign: visible content, pauses on hover and focus, with a pause button (WCAG 2.2.2).
   * backdrop: decoration behind other content, hidden from assistive technology; never the only place the content is.
   */
  variant?: "sign" | "backdrop" | undefined;
  labels?: Partial<Messages["marquee"]> | undefined;
  className?: string | undefined;
};

/**
 * An endless line of words or logos. The content is drawn twice and the track slides by half its width, so the second
 * copy lands exactly where the first began: the wrap is invisible. Under reduced motion the line stands still.
 */
function Marquee({ items, children, speed = 40, direction = "left", lines = 1, gap = "3rem", variant = "sign", labels, className }: MarqueeProps) {
  const l = useMessages("marquee", labels);
  const reduced = useReducedMotion();
  const [stopped, setStopped] = React.useState(false);
  const [held, setHeld] = React.useState(false);
  const sign = variant === "sign";
  const content = items ? items.map((item, i) => <li key={i} className="shrink-0">{item}</li>) : <li className="shrink-0">{children}</li>;
  const paused = stopped || (sign && held);

  return (
    <div
      data-slot="marquee"
      data-variant={variant}
      aria-hidden={sign ? undefined : true}
      className={cn("flex items-center gap-3", !sign && "pointer-events-none opacity-7 select-none", className)}
      onPointerEnter={() => setHeld(true)}
      onPointerLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setHeld(false)}
    >
      <div data-slot="marquee-lines" className="grid min-w-0 flex-1 gap-2 overflow-hidden">
        {Array.from({ length: lines }, (_, line) => (
          <Track key={line} speed={speed} reverse={(direction === "right") !== (line === 1)} paused={paused} still={reduced} gap={gap} hidden={line > 0}>
            {content}
          </Track>
        ))}
      </div>
      {sign && !reduced ? (
        <button
          type="button"
          onClick={() => setStopped((s) => !s)}
          className="press focus-ring inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-hairline bg-surface text-muted-foreground hover:text-foreground"
          aria-label={stopped ? l.play : l.pause}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5" fill="currentColor">
            {stopped ? <path d="M5 3.5v9l7.5-4.5z" /> : <path d="M4.5 3.5h2.5v9H4.5zM9 3.5h2.5v9H9z" />}
          </svg>
        </button>
      ) : null}
    </div>
  );
}

function Track({ speed, reverse, paused, still, gap, hidden, children }: { speed: number; reverse: boolean; paused: boolean; still: boolean; gap: string; hidden: boolean; children: React.ReactNode }) {
  const track = React.useRef<HTMLDivElement>(null);
  const animation = React.useRef<Animation | null>(null);

  React.useEffect(() => {
    const el = track.current;
    if (still || !el?.animate) return;
    // Linear on purpose: a sign that eases would seem to stall at every wrap.
    const a = el.animate([{ transform: "translateX(0)" }, { transform: "translateX(-50%)" }], { duration: speed * 1000, iterations: Infinity, easing: "linear", direction: reverse ? "reverse" : "normal" });
    animation.current = a;
    return () => {
      a.cancel();
      animation.current = null;
    };
  }, [speed, reverse, still]);

  React.useEffect(() => {
    if (paused) animation.current?.pause();
    else animation.current?.play();
  }, [paused, still, speed, reverse]);

  // Each copy ends with the gap too, so both copies are exactly half the track.
  const copy = { gap, paddingInlineEnd: gap };
  return (
    <div ref={track} data-slot="marquee-track" aria-hidden={hidden || undefined} className="flex w-max">
      <ul className="flex shrink-0 items-center" style={copy}>{children}</ul>
      <ul aria-hidden="true" className="flex shrink-0 items-center" style={copy}>{children}</ul>
    </div>
  );
}

export { Marquee };
