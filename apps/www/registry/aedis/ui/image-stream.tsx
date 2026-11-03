"use client";

import * as React from "react";

import { useReducedMotion } from "@/registry/aedis/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

/** The corridor's shape. Lengths are in cqw (hundredths of the stream's width), angles in degrees. */
export type StreamPath = {
  /** Depth of the 3D view, in px. */
  perspective: number;
  /** The card's aspect, width to height. */
  cardWidth: number;
  cardHeight: number;
  /** Card height where it is born, at the vanishing point, and where it leaves the frame. */
  birthHeight: number;
  exitHeight: number;
  /** Distance of a card's centre from the axis, at birth and at exit. Negative at birth: it starts across the axis. */
  railBirth: number;
  railExit: number;
  /** How hard the rails open as a card grows, then hold: 1 is a straight cone, more bends the ribbon outward sooner. */
  fan: number;
  /** The card's turn toward the viewer, at birth and at exit. */
  turnBirth: number;
  turnExit: number;
  /** Points sampled along the path. */
  stops: number;
};

export const streamPath: StreamPath = { perspective: 900, cardWidth: 3, cardHeight: 4, birthHeight: 2.6, exitHeight: 46, railBirth: -4, railExit: 74, fan: 1.6, turnBirth: 0, turnExit: 24, stops: 24 };

/**
 * Where a card is at `t` (0 at birth, 1 at exit): its height grows geometrically, so consecutive cards stay overlapped,
 * and its distance from the axis follows its growth, as in a real corridor, bent by `fan`.
 */
export function streamPoint(t: number, p: StreamPath) {
  const h = p.birthHeight * (p.exitHeight / p.birthHeight) ** t;
  const grown = (h - p.birthHeight) / (p.exitHeight - p.birthHeight);
  return {
    h,
    w: (h * p.cardWidth) / p.cardHeight,
    x: p.railBirth + (p.railExit - p.railBirth) * grown ** (1 / p.fan),
    turn: p.turnBirth + (p.turnExit - p.turnBirth) * t,
    opacity: Math.min(1, t / 0.06),
  };
}

/** The style of a card at `t` on the right (side 1) or left (−1) rail. Cards are drawn at exit size and scaled down. */
function cardStyle(t: number, side: 1 | -1, p: StreamPath) {
  const { h, x, turn, opacity } = streamPoint(t, p);
  const r = (n: number) => Math.round(n * 1000) / 1000;
  return { transform: `translate(-50%, -50%) translateX(${r(side * x)}cqw) rotateY(${r(-side * turn)}deg) scale(${r(h / p.exitHeight)})`, opacity: r(opacity), zIndex: Math.round(t * p.stops) };
}

/** The keyframes of one rail: the path sampled at `stops` points, played linearly. */
export function streamKeyframes(side: 1 | -1, p: StreamPath): Keyframe[] {
  return Array.from({ length: p.stops }, (_, k) => ({ offset: k / (p.stops - 1), ...cardStyle(k / (p.stops - 1), side, p) }));
}

type ImageStreamProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** The pictures, used in turn on both rails. They are decoration: the work they show lives elsewhere on the page. */
  images: string[];
  /** Cards on each rail. */
  cards?: number | undefined;
  /** Seconds between two cards. */
  speed?: number | undefined;
  /** The vanishing point's height, in % of the stream. */
  axis?: number | undefined;
  path?: Partial<StreamPath> | undefined;
  /** A still or a film at the vanishing point: the screen the pictures stream out of. */
  centre?: React.ReactNode;
  /** Drawn above the stream. */
  children?: React.ReactNode;
};

/**
 * A corridor of pictures rushing toward the viewer on two rails from a vanishing point. The path is a pure function
 * sampled into keyframes and played by the Web Animations API, so nothing runs per frame and no style element is added
 * to the page (the CSP stays strict). Every card starts mid-flight, so the corridor is full on the first frame; the same
 * mid-flight positions are its style without JavaScript and under reduced motion, a finished still. It pauses when off
 * screen.
 */
function ImageStream({ images, cards = 7, speed = 2.4, axis = 50, path, centre, children, className, ...props }: ImageStreamProps) {
  const reduced = useReducedMotion();
  const root = React.useRef<HTMLDivElement>(null);
  const p = React.useMemo(() => ({ ...streamPath, ...path }), [path]);
  const key = JSON.stringify([p, cards, speed]);

  React.useEffect(() => {
    const el = root.current;
    if (!el || reduced) return;
    const duration = speed * cards * 1000;
    const rails = { "1": streamKeyframes(1, p), "-1": streamKeyframes(-1, p) };
    const animations = [...el.querySelectorAll<HTMLElement>("[data-slot=image-stream-card]")].flatMap((card) => {
      if (!card.animate) return [];
      const a = card.animate(rails[card.dataset.side as "1" | "-1"], { duration, iterations: Infinity, easing: "linear" });
      // Negative delay: the card is already this far along when the stream starts.
      a.currentTime = Number(card.dataset.t) * duration;
      return [a];
    });
    const observer =
      typeof IntersectionObserver === "undefined"
        ? undefined
        : new IntersectionObserver(([e]) => animations.forEach((a) => (e?.isIntersecting ? a.play() : a.pause())));
    observer?.observe(el);
    return () => {
      observer?.disconnect();
      animations.forEach((a) => a.cancel());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- key stands for p, cards and speed
  }, [reduced, key]);

  const all = Array.from({ length: cards * 2 }, (_, i) => ({ side: (i % 2 ? -1 : 1) as 1 | -1, t: (Math.floor(i / 2) + (i % 2) / 2) / cards, src: images[i % images.length] }));
  return (
    <div
      ref={root}
      data-slot="image-stream"
      className={cn("@container relative aspect-video w-full overflow-hidden", className)}
      style={{ perspective: `${p.perspective}px` }}
      {...props}
    >
      <div aria-hidden="true" className="absolute inset-0">
        {all.map((c, i) => (
          <div
            key={i}
            data-slot="image-stream-card"
            data-side={c.side}
            data-t={c.t}
            className="absolute left-1/2 overflow-hidden rounded-md bg-muted shadow-elevation-2"
            style={{ top: `${axis}%`, width: `${(p.exitHeight * p.cardWidth) / p.cardHeight}cqw`, height: `${p.exitHeight}cqw`, ...cardStyle(c.t, c.side, p) }}
          >
            {c.src ? <img src={c.src} alt="" loading="lazy" decoding="async" className="size-full object-cover" /> : null}
          </div>
        ))}
        {centre ? (
          <div data-slot="image-stream-centre" className="absolute left-1/2 z-[4] w-[16cqw] -translate-x-1/2 -translate-y-1/2" style={{ top: `${axis}%` }}>
            {centre}
          </div>
        ) : null}
      </div>
      {children ? <div className="relative z-[100]">{children}</div> : null}
    </div>
  );
}

export { ImageStream };
