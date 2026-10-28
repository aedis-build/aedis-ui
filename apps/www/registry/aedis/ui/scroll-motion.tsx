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

/** How far the reader has scrolled through the enclosing Pin, from 0 to 1. 1 outside a Pin and under reduced motion. */
function usePinProgress() {
  return React.useContext(Progress);
}

type PinProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** How long the section stays pinned, in viewport heights of scrolling. */
  length?: number;
  children: React.ReactNode | ((progress: number) => React.ReactNode);
};

/**
 * Holds its content in the viewport while the page scrolls past it, and gives the children their progress (0–1) as
 * a render prop or through usePinProgress. Without JavaScript and under reduced motion, it is a plain section at
 * progress 1: everything in its final state.
 */
function Pin({ length = 1.5, className, children, ...props }: PinProps) {
  const reduced = useReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);
  const [progress, setProgress] = React.useState(1);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return setProgress(1);
    let frame = 0;
    const update = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
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
  }, [reduced]);

  const content = typeof children === "function" ? children(progress) : children;
  return (
    <Progress.Provider value={progress}>
      <div ref={ref} data-slot="pin" className={className} style={reduced ? undefined : { height: `${100 * (1 + length)}svh` }} {...props}>
        <div className={cn(!reduced && "sticky top-0 h-svh overflow-hidden")}>{content}</div>
      </div>
    </Progress.Provider>
  );
}

export { Parallax, Pin, Reveal, usePinProgress };
