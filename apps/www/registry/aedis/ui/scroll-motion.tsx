"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/registry/aedis/hooks/use-reduced-motion";

/* -------------------------------------------------------------------------------------------------------------------
 * The primitive: progress through a stretch of scroll.
 *
 * Every effect is a list of keyframes played by the scroll. Where the browser has scroll-driven animations the
 * keyframes run on a ViewTimeline and no script runs per frame. Elsewhere the same keyframes are paused and one shared
 * requestAnimationFrame loop sets their time from the scroll, so both paths compute the same values.
 * ----------------------------------------------------------------------------------------------------------------- */

export type RangeName = "cover" | "contain" | "entry" | "exit";
/** A point of a range: a named range of the element's way through the viewport, and an offset into it (0–100 %, or a length). */
export type RangePoint = readonly [RangeName, number | `${number}px` | `${number}svh`];
export type ScrollRange = { start?: RangePoint | undefined; end?: RangePoint | undefined };

const COVER: ScrollRange = { start: ["cover", 0], end: ["cover", 100] };
const VAR = "--scroll-progress";

/**
 * How far the page has scrolled at a point, counted from when the element's top meets the bottom of the visible
 * range `v` (the viewport less its scroll padding). Lengths in svh are of the whole viewport `vh`.
 */
function offset([name, at]: RangePoint, h: number, v: number, vh: number) {
  const ranges: Record<RangeName, [number, number]> = { cover: [0, v + h], contain: [Math.min(h, v), Math.max(h, v)], entry: [0, Math.min(h, v)], exit: [Math.max(h, v), v + h] };
  const [a, b] = ranges[name];
  if (typeof at === "number") return a + ((b - a) * at) / 100;
  return a + (at.endsWith("svh") ? (parseFloat(at) * vh) / 100 : parseFloat(at));
}

/**
 * The progress (0–1) of an element through a range, from its box and the viewport height, as a ViewTimeline counts
 * it. `inset` is [top, bottom] in px: a ViewTimeline leaves out the page's scroll padding, e.g. under a sticky header.
 */
export function scrollProgress(box: { top: number; height: number }, viewport: number, { start = COVER.start!, end = COVER.end! }: ScrollRange = COVER, [top, bottom]: [number, number] = [0, 0]) {
  const v = viewport - top - bottom;
  const s = viewport - bottom - box.top;
  const [a, b] = [offset(start, box.height, v, viewport), offset(end, box.height, v, viewport)];
  if (b <= a) return s >= b ? 1 : 0;
  return Math.min(1, Math.max(0, (s - a) / (b - a)));
}

/** The root's scroll padding, which a native ViewTimeline takes as its inset ("auto"). */
function scrollPadding(): [number, number] {
  const style = getComputedStyle(document.documentElement);
  return [parseFloat(style.scrollPaddingTop) || 0, parseFloat(style.scrollPaddingBottom) || 0];
}

// One loop for every fallback effect on the page: one scroll listener, at most one frame of work per frame.
/**
 * The box a ViewTimeline sees: the layout box, without the subject's own transform (a translate, or a scale about its
 * centre), which the effect itself may be moving.
 */
export function layoutBox(el: Element) {
  const r = el.getBoundingClientRect();
  const t = getComputedStyle(el).transform;
  if (!t || t === "none") return r;
  const m = new DOMMatrixReadOnly(t);
  const height = r.height / m.d;
  return { top: r.top - m.f - (height / 2) * (1 - m.d), height };
}

type Watcher = { subject: Element; range: ScrollRange; inset: boolean; set: (progress: number) => void };
const watchers = new Set<Watcher>();
let frame = 0;
const measure = (w: Watcher, padding: [number, number]) => w.set(scrollProgress(layoutBox(w.subject), window.innerHeight, w.range, w.inset ? padding : [0, 0]));
const tick = () => {
  frame = 0;
  const padding = scrollPadding();
  for (const w of watchers) measure(w, padding);
};
const schedule = () => void (frame ||= requestAnimationFrame(tick));

/**
 * Calls `set` with the subject's progress through `range` now and on every scroll or resize. With `inset`, the page's
 * scroll padding is left out of the viewport, as a native ViewTimeline does. Returns the stop function.
 */
export function watchScroll(subject: Element, range: ScrollRange, set: (progress: number) => void, { inset = false } = {}) {
  const w = { subject, range, inset, set };
  if (!watchers.size) {
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
  }
  watchers.add(w);
  measure(w, scrollPadding());
  return () => {
    watchers.delete(w);
    if (watchers.size) return;
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
    cancelAnimationFrame(frame);
    frame = 0;
  };
}

type ViewTimelineCtor = new (o: { subject: Element; inset?: string }) => AnimationTimeline;
const nativeTimeline = () => (typeof window === "undefined" ? undefined : (window as unknown as { ViewTimeline?: ViewTimelineCtor }).ViewTimeline);
const point = ([name, at]: RangePoint) => `${name} ${typeof at === "number" ? `${at}%` : at}`;

/**
 * Plays `keyframes` on `el` as `subject` crosses `range`. Native where the browser can, the shared loop otherwise or
 * when `fallback` is set. `inset` "auto" leaves the page's scroll padding out of the viewport, as CSS view() does;
 * "none" counts the whole viewport, for something stuck at its very top. Marks the element with data-scroll-mode.
 */
export function animateOnScroll(el: Element, keyframes: Keyframe[], { subject = el, range = COVER, fallback = false, inset = "auto" }: { subject?: Element; range?: ScrollRange; fallback?: boolean; inset?: "auto" | "none" } = {}) {
  if (!el.animate) return () => {};
  const Timeline = fallback ? undefined : nativeTimeline();
  const node = el as HTMLElement | SVGElement;
  node.dataset.scrollMode = Timeline ? "native" : "fallback";
  if (Timeline) {
    const a = el.animate(keyframes, { fill: "both", timeline: new Timeline({ subject, inset: inset === "auto" ? "auto" : "0px" }), rangeStart: point(range.start ?? COVER.start!), rangeEnd: point(range.end ?? COVER.end!) } as KeyframeAnimationOptions);
    return () => a.cancel();
  }
  const a = el.animate(keyframes, { duration: 1000, fill: "both" });
  a.pause();
  const stop = watchScroll(subject, range, (p) => void (a.currentTime = p * 1000), { inset: inset === "auto" });
  return () => {
    stop();
    a.cancel();
  };
}

// The progress is a registered number, so it interpolates when a ViewTimeline animates it. Unset, it is 1: the end state.
let registered = false;
function registerProgress() {
  if (registered || typeof CSS === "undefined" || !CSS.registerProperty) return;
  registered = true;
  try {
    CSS.registerProperty({ name: VAR, syntax: "<number>", inherits: true, initialValue: "1" });
  } catch {
    // Already registered by another copy of this module.
  }
}

const Mode = React.createContext(false);

/** Forces the JavaScript fallback for the effects inside, e.g. to compare it with the native timeline. */
function ScrollMotionProvider({ fallback = false, children }: { fallback?: boolean | undefined; children: React.ReactNode }) {
  return <Mode.Provider value={fallback}>{children}</Mode.Provider>;
}

/**
 * Runs a scroll effect on `ref` after mount, again when `deps` change (compared by value), and never under reduced
 * motion: then the element keeps its own style, which is the end state of every effect here.
 */
function useScrollEffect(ref: React.RefObject<Element | null>, run: (el: Element, fallback: boolean) => () => void, deps: unknown[]) {
  const reduced = useReducedMotion();
  const fallback = React.useContext(Mode);
  const key = JSON.stringify(deps);
  const latest = React.useRef(run);
  latest.current = run;
  React.useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    return latest.current(el, fallback);
  }, [ref, reduced, fallback, key]);
}

/** useScrollEffect for a list of keyframes. */
function useScrollKeyframes(ref: React.RefObject<Element | null>, keyframes: Keyframe[], range: ScrollRange) {
  useScrollEffect(ref, (el, fallback) => animateOnScroll(el, keyframes, { range, fallback }), [keyframes, range]);
}

/**
 * Sets `--scroll-progress` (0–1) on the element as it crosses `range`, for effects written in CSS with
 * `var(--scroll-progress)`. Natively it never runs per frame. Unset, and under reduced motion, the value is 1.
 */
function useScrollProgress(ref: React.RefObject<HTMLElement | null>, range: ScrollRange = COVER) {
  useScrollEffect(
    ref,
    (el, fallback) => {
      const node = el as HTMLElement;
      registerProgress();
      if (!fallback && nativeTimeline()) return animateOnScroll(el, [{ [VAR]: 0 }, { [VAR]: 1 }] as Keyframe[], { range });
      node.dataset.scrollMode = "fallback";
      const stop = watchScroll(el, range, (p) => node.style.setProperty(VAR, String(p)), { inset: true });
      return () => {
        stop();
        node.style.removeProperty(VAR);
      };
    },
    [range],
  );
}

type TimelineProps = React.ComponentProps<"div"> & { range?: ScrollRange | undefined };

/** A box whose `--scroll-progress` follows the scroll through `range` (cover by default), for effects written in CSS. */
function ScrollTimeline({ range, className, ...props }: TimelineProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  useScrollProgress(ref, range);
  return <div ref={ref} data-slot="scroll-timeline" className={className} {...props} />;
}

/* --- Effects --------------------------------------------------------------------------------------------------- */

/** A window that opens to full bleed as it enters the viewport: a clip-path inset with round corners, to none. */
function Curtain({ range = { start: ["entry", 0], end: ["entry", 100] }, className, ...props }: TimelineProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  useScrollKeyframes(ref, [{ clipPath: "inset(12% 8% 0% 8% round 16px)" }, { clipPath: "inset(0% 0% 0% 0% round 0px)" }], range);
  return <div ref={ref} data-slot="curtain" className={className} {...props} />;
}

/** A slow push-in: its content scales from `scale` to 1 across the whole view, clipped to the box. */
function Dolly({ scale = 1.18, range = COVER, className, children, ...props }: TimelineProps & { scale?: number | undefined }) {
  const frame = React.useRef<HTMLDivElement>(null);
  const ref = React.useRef<HTMLDivElement>(null);
  // The box does not move, so it is the one the scroll is measured on.
  useScrollEffect(ref, (el, fallback) => animateOnScroll(el, [{ transform: `scale(${scale})` }, { transform: "scale(1)" }], { subject: frame.current ?? el, range, fallback }), [scale, range]);
  return (
    <div ref={frame} data-slot="dolly" className={cn("overflow-clip", className)} {...props}>
      <div ref={ref}>{children}</div>
    </div>
  );
}

/** Draws the SVG strokes inside it as it crosses `range` (contain by default). Without the effect they are simply drawn. */
function Draw({ range = { start: ["contain", 0], end: ["contain", 100] }, className, ...props }: TimelineProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  useScrollEffect(
    ref,
    (el, fallback) => {
      const strokes = [...el.querySelectorAll<SVGGeometryElement>("path, line, polyline, polygon, circle, ellipse, rect")];
      const stops = strokes.map((s) => {
        s.setAttribute("pathLength", "1");
        s.style.strokeDasharray = "1";
        const stop = animateOnScroll(s, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { subject: el, range, fallback });
        return () => {
          stop();
          s.style.strokeDasharray = "";
        };
      });
      return () => stops.forEach((stop) => stop());
    },
    [range],
  );
  return <div ref={ref} data-slot="draw" className={className} {...props} />;
}

type RevealProps = React.ComponentProps<"div"> & {
  /** Rises out of a 6 px blur as well as a fade. */
  blur?: boolean | undefined;
};

/**
 * Fades and lifts its content in as it enters the viewport. The server renders it visible: only once JavaScript runs
 * is content below the fold hidden, to be revealed. Content already in view, and everything under reduced motion,
 * never moves.
 */
function Reveal({ blur = false, className, ...props }: RevealProps) {
  const reduced = useReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);
  const [state, setState] = React.useState<"static" | "hidden" | "shown">("static");

  React.useEffect(() => {
    const el = ref.current;
    if (!el || reduced || typeof IntersectionObserver === "undefined") return;
    let first = true;
    const observer = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) {
        setState(first ? "static" : "shown");
        observer.disconnect();
      } else if (first) setState("hidden");
      first = false;
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [reduced]);

  return (
    <div
      ref={ref}
      data-slot="reveal"
      data-state={state}
      onTransitionEnd={() => state === "shown" && setState("static")}
      className={cn(
        "transition-[opacity,transform,filter] duration-(--duration-enter) ease-out data-[state=hidden]:translate-y-6 data-[state=hidden]:transition-none data-[state=hidden]:opacity-0 data-[state=hidden]:will-change-[opacity,transform] data-[state=shown]:will-change-[opacity,transform]",
        blur && "data-[state=hidden]:blur-[6px]",
        className,
      )}
      {...props}
    />
  );
}

type ParallaxProps = React.ComponentProps<"div"> & {
  /** How far, in px, the content drifts up as it crosses the viewport: from +distance to −distance. */
  distance?: number;
};

/** Moves its content against the scroll, by transform only, across the whole view. Still under reduced motion. */
function Parallax({ distance = 40, className, ...props }: ParallaxProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  useScrollKeyframes(ref, [{ transform: `translateY(${distance}px)` }, { transform: `translateY(${-distance}px)` }], COVER);
  return <div ref={ref} data-slot="parallax" className={className} {...props} />;
}

/* --- Pin ------------------------------------------------------------------------------------------------------- */

const Progress = React.createContext(1);
const Pinned = React.createContext(false);

/** How far the reader has scrolled through the enclosing Pin, from 0 to 1. 1 outside a Pin and when not pinned. */
function usePinProgress() {
  return React.useContext(Progress);
}

/** Whether the enclosing Pin is pinned now: false on the server, under reduced motion and where its media does not match. */
function usePinned() {
  return React.useContext(Pinned);
}

export type PinHandle = {
  /** Scrolls the page to this progress of the pin (0–1), by its own geometry. Always instant under reduced motion. */
  scrollTo(progress: number, options?: { behavior?: ScrollBehavior }): void;
};

type PinProps = Omit<React.ComponentProps<"div">, "children" | "ref"> & {
  /** How long the section stays pinned, in viewport heights of scrolling. */
  length?: number;
  /** Pins only where this media query matches, e.g. "(min-width: 1000px)"; elsewhere it is a plain section. */
  media?: string;
  onPinnedChange?: (pinned: boolean) => void;
  ref?: React.Ref<PinHandle>;
  children: React.ReactNode | ((progress: number) => React.ReactNode);
};

const noop = () => () => {};
function useMedia(query: string | undefined) {
  return React.useSyncExternalStore(
    (onChange) => {
      const m = query ? window.matchMedia?.(query) : undefined;
      m?.addEventListener("change", onChange);
      return () => m?.removeEventListener("change", onChange);
    },
    () => (query ? (window.matchMedia?.(query).matches ?? false) : true),
    () => false,
  );
}

// While pinned the box is taller than the viewport, so contain runs from its top at the top to its bottom at the bottom.
// Pin counts against the whole viewport, scroll padding included: it is stuck at the very top.
const PINNED_RUN: ScrollRange = { start: ["contain", 0], end: ["contain", 100] };

/** Whether a sticky runway should be laid out: after mount, without reduced motion, where `media` matches. */
function useRunway(media?: string) {
  const reduced = useReducedMotion();
  const mounted = React.useSyncExternalStore(noop, () => true, () => false);
  const matches = useMedia(media);
  return mounted && !reduced && matches;
}

/**
 * Holds its content in the viewport while the page scrolls past it, and gives the children their progress (0–1) as
 * a render prop or through usePinProgress. The server, a page without JavaScript, reduced motion and a `media` that
 * does not match all get a plain section at progress 1; it pins after mount. Its ref scrolls the page to a progress.
 */
function Pin({ length = 1.5, media, onPinnedChange, ref, className, children, ...props }: PinProps) {
  const reduced = useReducedMotion();
  const pinned = useRunway(media);
  const el = React.useRef<HTMLDivElement>(null);
  const [progress, setProgress] = React.useState(1);

  // Measured before paint, so the first progress the children draw is the real one, not 1.
  React.useLayoutEffect(() => {
    const node = el.current;
    if (!node || !pinned) return setProgress(1);
    return watchScroll(node, PINNED_RUN, setProgress);
  }, [pinned]);

  const changed = React.useRef(onPinnedChange);
  changed.current = onPinnedChange;
  React.useEffect(() => {
    changed.current?.(pinned);
  }, [pinned]);

  React.useImperativeHandle(
    ref,
    () => ({
      scrollTo(to, { behavior = "smooth" } = {}) {
        const node = el.current;
        if (!node) return;
        const top = node.getBoundingClientRect().top + window.scrollY;
        const run = pinned ? Math.max(0, node.offsetHeight - window.innerHeight) : 0;
        window.scrollTo({ top: top + run * Math.min(1, Math.max(0, to)), behavior: reduced ? "auto" : behavior });
      },
    }),
    [pinned, reduced],
  );

  const content = typeof children === "function" ? children(progress) : children;
  return (
    <Pinned.Provider value={pinned}>
      <Progress.Provider value={progress}>
        <div ref={el} data-slot="pin" data-pinned={pinned || undefined} className={className} style={pinned ? { height: `${100 * (1 + length)}svh` } : undefined} {...props}>
          <div className={cn(pinned && "sticky top-0 h-svh overflow-hidden")}>{content}</div>
        </div>
      </Progress.Provider>
    </Pinned.Provider>
  );
}

/* --- ScrollStage ----------------------------------------------------------------------------------------------- */

const Stage = React.createContext<React.RefObject<HTMLDivElement | null> | null>(null);

type ScrollStageProps = React.ComponentProps<"div"> & {
  /** The stage's whole height in viewport heights: it stays on screen for `track − 1` of them. */
  track?: number | undefined;
};

/**
 * A sticky scene played by the scroll: its StageLayers move between keyframes over stretches of the track, counted in
 * viewport heights from when the stage reaches the top. Without JavaScript, before hydration and under reduced motion
 * it is one screen with every layer in its own style.
 */
function ScrollStage({ track = 3, className, children, ...props }: ScrollStageProps) {
  const runway = useRunway();
  const ref = React.useRef<HTMLDivElement>(null);
  return (
    <Stage.Provider value={runway ? ref : null}>
      <div ref={ref} data-slot="scroll-stage" data-staged={runway || undefined} className="w-full" style={runway ? { height: `${100 * track}svh` } : undefined} {...props}>
        <div className={cn("relative h-svh overflow-hidden", runway && "sticky top-0", className)}>{children}</div>
      </div>
    </Stage.Provider>
  );
}

/** The properties a stage layer may move: none of them changes layout. */
export type StageFrame = { opacity?: number; transform?: string; filter?: string; clipPath?: string; borderRadius?: string };

type StageLayerProps = React.ComponentProps<"div"> & {
  /** When it moves, in viewport heights scrolled since the stage reached the top: [from, to]. */
  at?: [number, number] | undefined;
  from: StageFrame;
  to: StageFrame;
};

function StageLayer({ at = [0, 1], from, to, className, ...props }: StageLayerProps) {
  const stage = React.useContext(Stage);
  const ref = React.useRef<HTMLDivElement>(null);
  const range: ScrollRange = { start: ["contain", `${at[0] * 100}svh`], end: ["contain", `${at[1] * 100}svh`] };
  // Outside a laid-out stage (server, reduced motion) there is no runway to play: the layer keeps its own style.
  // The stage sticks at the very top, so its run is counted against the whole viewport, scroll padding included.
  useScrollEffect(
    ref,
    (el, fallback) => (stage?.current ? animateOnScroll(el, [from, to] as Keyframe[], { subject: stage.current, range, fallback, inset: "none" }) : () => {}),
    [range, from, to, stage !== null],
  );
  return <div ref={ref} data-slot="stage-layer" className={cn("absolute inset-0", className)} {...props} />;
}

export { Curtain, Dolly, Draw, Parallax, Pin, Reveal, ScrollMotionProvider, ScrollStage, ScrollTimeline, StageLayer, useScrollProgress, usePinned, usePinProgress };
