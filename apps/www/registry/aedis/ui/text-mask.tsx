"use client";

import * as React from "react";

import { useReducedMotion } from "@/registry/aedis/hooks/use-reduced-motion";
import { animateOnScroll, useScrollEffect, type ScrollRange } from "@/registry/aedis/ui/scroll-motion";
import { cn } from "@/lib/utils";

export type TextMaskFly = {
  /** The glyph to fly through, by index in `text`: pick one with a solid stroke, such as the stem of an L. */
  glyph: number;
  /** The point to aim for, in the glyph's own box (0–1 on each axis). */
  origin?: [x: number, y: number] | undefined;
  /** The scroll the flight takes, in viewport heights of a sticky runway. */
  track?: number | undefined;
};

type TextMaskProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** The word drawn with the picture inside it. Decorative: screen readers get `label`. */
  text: string;
  /** The accessible name, rendered as real text for screen readers. */
  label: string;
  /** A picture, or a film (muted, looping, never playing under reduced motion). */
  image?: string | undefined;
  video?: string | undefined;
  poster?: string | undefined;
  /** Flies the camera through one glyph as the page scrolls, until the picture fills the screen. */
  fly?: TextMaskFly | undefined;
};

// The zoom eases by keyframes: slow at first, then it rushes in. The mask fades over the last third.
const ZOOM = [
  [0, 1],
  [0.15, 1.3],
  [0.4, 2.2],
  [0.7, 7],
  [1, 34],
] as const;
const FLIGHT: ScrollRange = { start: ["contain", 0], end: ["contain", 100] };

/**
 * A word set large with a picture or film inside its letters: the media sits under an opaque mask layer whose white
 * letters are multiplied over it, so it shows only through the glyphs. With `fly`, the word scales around a point
 * inside one glyph, measured with a Range, so the point stays inside the stroke at any size, and moves it to the centre
 * of the screen while the picture opens up. Without JavaScript and under reduced motion it is a still mask.
 */
function TextMask({ text, label, image, video, poster, fly, className, style, ...props }: TextMaskProps) {
  const reduced = useReducedMotion();
  const mounted = React.useSyncExternalStore(noop, () => true, () => false);
  const runway = Boolean(fly) && mounted && !reduced;
  const root = React.useRef<HTMLDivElement>(null);
  const stage = React.useRef<HTMLDivElement>(null);
  const mask = React.useRef<HTMLDivElement>(null);
  const word = React.useRef<HTMLSpanElement>(null);
  const [aim, setAim] = React.useState<{ origin: string; dx: number; dy: number } | null>(null);
  const filmRef = React.useRef<HTMLVideoElement>(null);

  const [glyph, ox, oy] = [fly?.glyph ?? 0, fly?.origin?.[0] ?? 0.5, fly?.origin?.[1] ?? 0.5];
  // The glyph's point, in the word's own box, and how far it must travel to reach the centre of the stage.
  // Keyed on plain values: a `fly` written inline is a new object on every render.
  React.useLayoutEffect(() => {
    const el = word.current;
    const box = stage.current;
    const node = el?.firstChild;
    if (!runway || !el || !box || !node) return;
    const measure = () => {
      const range = document.createRange();
      if (!range.getBoundingClientRect) return;
      range.setStart(node, Math.min(glyph, text.length - 1));
      range.setEnd(node, Math.min(glyph + 1, text.length));
      const g = range.getBoundingClientRect();
      const w = el.getBoundingClientRect();
      // Shares of the word's box stay true while the word is scaled mid-flight; offsets ignore the transform.
      const rx = (g.left + ox * g.width - w.left) / w.width;
      const ry = (g.top + oy * g.height - w.top) / w.height;
      const x = el.offsetLeft + rx * el.offsetWidth;
      const y = el.offsetTop + ry * el.offsetHeight;
      const next = { origin: `${(rx * 100).toFixed(2)}% ${(ry * 100).toFixed(2)}%`, dx: Math.round(box.clientWidth / 2 - x), dy: Math.round(box.clientHeight / 2 - y) };
      setAim((prev) => (prev && prev.origin === next.origin && prev.dx === next.dx && prev.dy === next.dy ? prev : next));
    };
    measure();
    // The word's own size changes when the web font arrives; the stage's does not.
    void document.fonts?.ready.then(measure);
    const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(measure);
    observer?.observe(box);
    observer?.observe(el);
    return () => observer?.disconnect();
  }, [glyph, ox, oy, runway, text]);

  useScrollEffect(
    word,
    (el, fallback) => {
      if (!aim || !root.current || !mask.current) return () => {};
      const zoom = ZOOM.map(([offset, scale]) => ({ offset, transform: `translate(${offset ? aim.dx : 0}px, ${offset ? aim.dy : 0}px) scale(${scale})` }));
      const options = { subject: root.current, range: FLIGHT, fallback, inset: "none" as const };
      const stops = [animateOnScroll(el, zoom, options), animateOnScroll(mask.current, [{ opacity: 1 }, { opacity: 1, offset: 0.66 }, { opacity: 0 }], options)];
      return () => stops.forEach((stop) => stop());
    },
    [aim],
  );

  // A film plays muted and looping, and stays on its poster under reduced motion.
  React.useEffect(() => {
    const film = filmRef.current;
    if (!film) return;
    if (reduced) film.pause();
    else void film.play?.()?.catch(() => {});
  }, [reduced]);

  return (
    <div
      ref={root}
      data-slot="text-mask"
      data-flying={runway || undefined}
      className={cn("@container relative w-full", className)}
      style={runway ? { height: `${100 * (1 + (fly?.track ?? 2))}svh`, ...style } : style}
      {...props}
    >
      <span className="sr-only">{label}</span>
      <div ref={stage} aria-hidden="true" className={cn("relative grid place-items-center overflow-hidden", runway ? "sticky top-0 h-svh" : "py-[6cqi]")}>
        {video ? (
          <video ref={filmRef} src={video} poster={poster} muted loop playsInline preload="metadata" className="absolute inset-0 size-full object-cover" />
        ) : image ? (
          <img src={image} alt="" decoding="async" className="absolute inset-0 size-full object-cover" />
        ) : null}
        <div ref={mask} data-slot="text-mask-layer" className="absolute inset-0 grid place-items-center bg-media-mask mix-blend-multiply">
          <span
            ref={word}
            className="block leading-none font-semibold tracking-tight whitespace-nowrap text-on-media"
            style={{ fontSize: `${Math.min(40, 150 / Math.max(1, text.length))}cqi`, transformOrigin: aim?.origin }}
          >
            {text}
          </span>
        </div>
        {/* Holds the stage open to the word's height when it is not a full screen. */}
        <span className="invisible block leading-none font-semibold whitespace-nowrap" style={{ fontSize: `${Math.min(40, 150 / Math.max(1, text.length))}cqi` }}>
          {text}
        </span>
      </div>
    </div>
  );
}

function noop() {
  return () => {};
}

export { TextMask };
