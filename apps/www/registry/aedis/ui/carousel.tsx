"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/registry/aedis/hooks/use-reduced-motion";
import { useMessages, type Messages } from "@/registry/aedis/lib/locale";
import { Button } from "@/registry/aedis/ui/button";

type Labels = Partial<Messages["carousel"]>;

type CarouselProps = {
  /** Names the carousel, e.g. "Selected work". */
  label: string;
  /** Each child is one slide. */
  children: React.ReactNode;
  /** Off by default. On, the slides advance every `interval` ms, with a pause button and a progress bar. */
  autoplay?: boolean;
  interval?: number;
  className?: string;
  /** Classes for each slide, e.g. "basis-1/2" to show two at a time. */
  slideClassName?: string;
  labels?: Labels;
};

/**
 * Advances every `interval` ms while it runs. It never runs under reduced motion, and holds while the pointer or the
 * focus is inside the carousel and while the tab is hidden; the person can pause it for good with the button.
 */
function useAutoplay(enabled: boolean, interval: number, index: number, advance: () => void) {
  const reduced = useReducedMotion();
  const [playing, setPlaying] = React.useState(true);
  const [held, setHeld] = React.useState(false);
  const [hidden, setHidden] = React.useState(false);
  const next = React.useRef(advance);
  next.current = advance;

  React.useEffect(() => {
    const onChange = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);

  const active = enabled && !reduced;
  const running = active && playing && !held && !hidden;
  React.useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => next.current(), interval);
    return () => clearTimeout(t);
  }, [running, interval, index]);

  const hold = {
    onPointerEnter: () => setHeld(true),
    onPointerLeave: () => setHeld(false),
    onFocus: () => setHeld(true),
    onBlur: (e: React.FocusEvent) => !e.currentTarget.contains(e.relatedTarget) && setHeld(false),
  };
  return { active, running, playing, setPlaying, reduced, hold };
}

const ChevronLeft = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M10 3.5L5.5 8l4.5 4.5" />
  </svg>
);
const ChevronRight = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M6 3.5L10.5 8 6 12.5" />
  </svg>
);

/** Pause first, so it comes early in the tab order; then previous, next and where the person is. */
function Controls({
  l,
  autoplay,
  index,
  count,
  interval,
  go,
  className,
}: {
  l: Messages["carousel"];
  autoplay: ReturnType<typeof useAutoplay>;
  index: number;
  count: number;
  interval: number;
  go: (i: number) => void;
  className?: string;
}) {
  const bar = React.useRef<HTMLSpanElement>(null);
  React.useEffect(() => {
    if (!autoplay.running || !bar.current?.animate) return;
    const a = bar.current.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: interval, fill: "forwards" });
    return () => a.cancel();
  }, [autoplay.running, interval, index]);
  return (
    <div data-slot="carousel-controls" className={cn("flex items-center gap-2", className)}>
      {autoplay.active ? (
        <>
          <Button variant="secondary" size="icon" aria-label={autoplay.playing ? l.pause : l.play} onClick={() => autoplay.setPlaying(!autoplay.playing)}>
            {autoplay.playing ? (
              <svg viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">
                <rect x="4" y="3" width="3" height="10" rx="1" />
                <rect x="9" y="3" width="3" height="10" rx="1" />
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">
                <path d="M5 3.5v9l7.5-4.5z" />
              </svg>
            )}
          </Button>
          <span aria-hidden="true" className="h-1 w-16 overflow-hidden rounded-full bg-muted">
            <span ref={bar} data-slot="carousel-progress" className="block h-full origin-left scale-x-0 bg-primary" />
          </span>
        </>
      ) : null}
      <span className="ml-auto rounded-sm bg-surface/85 px-1.5 text-footnote text-muted-foreground tabular-nums" aria-hidden="true">
        {index + 1} / {count}
      </span>
      <Button variant="secondary" size="icon" aria-label={l.previous} onClick={() => go(index - 1)}>
        <ChevronLeft />
      </Button>
      <Button variant="secondary" size="icon" aria-label={l.next} onClick={() => go(index + 1)}>
        <ChevronRight />
      </Button>
    </div>
  );
}

const slideName = (l: Messages["carousel"], i: number, count: number) => l.slide.replace("{index}", String(i + 1)).replace("{count}", String(count));

/**
 * A gallery that scrolls one slide at a time: previous and next, swipe on touch (native scroll snap), slides named
 * "n of m", and those out of view inert.
 */
function Carousel({ label, children, autoplay = false, interval = 5000, className, slideClassName, labels }: CarouselProps) {
  const l = useMessages("carousel", labels);
  const slides = React.Children.toArray(children);
  const count = slides.length;
  const track = React.useRef<HTMLDivElement>(null);
  const [index, setIndex] = React.useState(0);
  const [visible, setVisible] = React.useState<ReadonlySet<number>>(new Set([0]));
  const reduced = useReducedMotion();

  React.useEffect(() => {
    const root = track.current;
    if (!root || typeof IntersectionObserver === "undefined") return;
    const seen = new Set<number>([0]);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const i = Number((e.target as HTMLElement).dataset.index);
          if (e.intersectionRatio >= 0.6) seen.add(i);
          else seen.delete(i);
        }
        setVisible(new Set(seen));
        if (seen.size) setIndex(Math.min(...seen));
      },
      { root, threshold: [0, 0.6, 1] },
    );
    for (const el of root.children) observer.observe(el);
    return () => observer.disconnect();
  }, [count]);

  const go = (i: number) => {
    const n = (i + count) % count;
    const el = track.current?.children[n] as HTMLElement | undefined;
    track.current?.scrollTo?.({ left: el?.offsetLeft ?? 0, behavior: reduced ? "auto" : "smooth" });
    setIndex(n);
    if (typeof IntersectionObserver === "undefined") setVisible(new Set([n]));
  };
  const play = useAutoplay(autoplay, interval, index, () => go(index + 1));

  return (
    <section aria-roledescription="carousel" aria-label={label} data-slot="carousel" className={cn("flex flex-col gap-3", className)} {...play.hold}>
      <Controls l={l} autoplay={play} index={index} count={count} interval={interval} go={go} className="order-last" />
      <div
        ref={track}
        aria-live={play.running ? "off" : "polite"}
        className="relative flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain rounded-md [scrollbar-width:none]"
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            data-index={i}
            role="group"
            aria-roledescription="slide"
            aria-label={slideName(l, i, count)}
            inert={!visible.has(i)}
            className={cn("min-w-0 shrink-0 grow-0 basis-full snap-start", slideClassName)}
          >
            {slide}
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * One slide at a time, cross-faded: for a hero or a full-screen background. It fills its container; give it a height.
 * Swipe on touch, previous and next, the same autoplay rules as Carousel.
 */
function Slideshow({ label, children, autoplay = false, interval = 6000, className, slideClassName, labels }: CarouselProps) {
  const l = useMessages("carousel", labels);
  const slides = React.Children.toArray(children);
  const count = slides.length;
  const [index, setIndex] = React.useState(0);
  const go = (i: number) => setIndex((i + count) % count);
  const play = useAutoplay(autoplay, interval, index, () => go(index + 1));
  const start = React.useRef<number | null>(null);

  return (
    <section aria-roledescription="carousel" aria-label={label} data-slot="slideshow" className={cn("relative h-full min-h-48 overflow-hidden", className)} {...play.hold}>
      <Controls l={l} autoplay={play} index={index} count={count} interval={interval} go={go} className="absolute inset-x-3 bottom-3 z-10" />
      <div
        aria-live={play.running ? "off" : "polite"}
        className="absolute inset-0 touch-pan-y"
        onPointerDown={(e) => (start.current = e.pointerType === "mouse" ? null : e.clientX)}
        onPointerUp={(e) => {
          if (start.current === null) return;
          const dx = e.clientX - start.current;
          start.current = null;
          if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
        }}
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            role="group"
            aria-roledescription="slide"
            aria-label={slideName(l, i, count)}
            inert={i !== index}
            data-current={i === index || undefined}
            className={cn("absolute inset-0 opacity-0 transition-opacity duration-(--duration-enter) ease-out data-current:opacity-100", slideClassName)}
          >
            {slide}
          </div>
        ))}
      </div>
    </section>
  );
}

export { Carousel, Slideshow };
