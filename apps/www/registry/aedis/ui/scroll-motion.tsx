"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/registry/aedis/hooks/use-reduced-motion";

type RevealProps = React.ComponentProps<"div">;

/**
 * Fades and lifts its content in as it enters the viewport. The server renders it visible: only once JavaScript runs
 * is content below the fold hidden, to be revealed. Content already in view, and everything under reduced motion,
 * never moves.
 */
function Reveal({ className, ...props }: RevealProps) {
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
        "transition-[opacity,transform] duration-(--duration-enter) ease-out data-[state=hidden]:translate-y-6 data-[state=hidden]:transition-none data-[state=hidden]:opacity-0 data-[state=hidden]:will-change-[opacity,transform] data-[state=shown]:will-change-[opacity,transform]",
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

/**
 * Moves its content against the scroll. It uses a scroll-driven animation (ViewTimeline) where the browser has one,
 * and requestAnimationFrame on scroll elsewhere; only transform moves. Still under reduced motion.
 */
function Parallax({ distance = 40, className, ...props }: ParallaxProps) {
  const reduced = useReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    const keyframes = [{ transform: `translateY(${distance}px)` }, { transform: `translateY(${-distance}px)` }];
    const Timeline = (window as unknown as { ViewTimeline?: new (o: { subject: Element }) => AnimationTimeline }).ViewTimeline;
    if (Timeline && el.animate) {
      const animation = el.animate(keyframes, { fill: "both", timeline: new Timeline({ subject: el }) } as KeyframeAnimationOptions);
      return () => animation.cancel();
    }
    let frame = 0;
    let idle: ReturnType<typeof setTimeout>;
    const update = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (window.innerHeight - r.top) / (window.innerHeight + r.height)));
      el.style.transform = `translateY(${distance - 2 * distance * p}px)`;
    };
    const onScroll = () => {
      el.style.willChange = "transform";
      clearTimeout(idle);
      idle = setTimeout(() => (el.style.willChange = ""), 200);
      frame ||= requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
      clearTimeout(idle);
      el.style.transform = el.style.willChange = "";
    };
  }, [reduced, distance]);

  return <div ref={ref} data-slot="parallax" className={className} {...props} />;
}

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

/**
 * Holds its content in the viewport while the page scrolls past it, and gives the children their progress (0–1) as
 * a render prop or through usePinProgress. The server, a page without JavaScript, reduced motion and a `media` that
 * does not match all get a plain section at progress 1; it pins after mount. Its ref scrolls the page to a progress.
 */
function Pin({ length = 1.5, media, onPinnedChange, ref, className, children, ...props }: PinProps) {
  const reduced = useReducedMotion();
  const mounted = React.useSyncExternalStore(noop, () => true, () => false);
  const matches = useMedia(media);
  const pinned = mounted && !reduced && matches;
  const el = React.useRef<HTMLDivElement>(null);
  const [progress, setProgress] = React.useState(1);

  // Measured before paint, so the first progress the children draw is the real one, not 1.
  React.useLayoutEffect(() => {
    const node = el.current;
    if (!node || !pinned) return setProgress(1);
    let frame = 0;
    const update = () => {
      frame = 0;
      const r = node.getBoundingClientRect();
      const run = r.height - window.innerHeight;
      setProgress(run > 0 ? Math.min(1, Math.max(0, -r.top / run)) : 1);
    };
    const onScroll = () => void (frame ||= requestAnimationFrame(update));
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
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

export { Parallax, Pin, Reveal, usePinned, usePinProgress };
