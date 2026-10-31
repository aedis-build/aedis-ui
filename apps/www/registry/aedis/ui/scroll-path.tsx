"use client";

import * as React from "react";

import { Draw, type ScrollRange } from "@/registry/aedis/ui/scroll-motion";
import { cn } from "@/lib/utils";

/** Hand-drawn lines in a 100 × 100 box, stretched to the lane. Absolute commands with x,y pairs (M, L, C, S, Q, T). */
export const scrollPathPresets = {
  wave: "M50 0 C10 15, 90 30, 50 45 S10 75, 50 90 S70 100, 60 100",
  loop: "M30 0 C80 10, 90 30, 50 40 C10 50, 20 70, 60 65 C90 60, 80 90, 40 100",
  script: "M70 0 C20 5, 10 20, 50 30 C90 40, 80 55, 40 60 C0 65, 20 85, 55 88 C80 90, 70 98, 50 100",
} as const;

/**
 * Scales a path's x,y pairs from the 0–100 box to `w` × `h` pixels. The SVG is then drawn at its own size, never
 * stretched: a stretched one would need non-scaling-stroke, which breaks the pathLength dashes that draw it.
 */
export function fitPath(d: string, w: number, h: number) {
  const round = (n: number) => Math.round(n * 10) / 10;
  return d.replace(/(-?\d*\.?\d+)[\s,]+(-?\d*\.?\d+)/g, (_, x: string, y: string) => `${round((parseFloat(x) * w) / 100)} ${round((parseFloat(y) * h) / 100)}`);
}

type ScrollPathProps = React.ComponentProps<"div"> & {
  /** The path, in a 0–100 box on both axes, or a preset. */
  d?: keyof typeof scrollPathPresets | (string & {}) | undefined;
  /** Where the line may run. left and right keep it in a column of its own, beside the content; full runs behind it. */
  lane?: "left" | "right" | "full" | undefined;
  /** The lane's width as a share of the box (left and right). */
  laneWidth?: number | undefined;
  range?: ScrollRange | undefined;
  strokeWidth?: number | undefined;
  opacity?: number | undefined;
};

/**
 * A single line that draws itself through a section as the reader scrolls (Draw, from scroll-motion). In a left or
 * right lane the line has a column of its own, so the content beside it can never sit under the stroke; in a full lane
 * it runs behind, and in development a warning names any text it crosses. Decorative, and fully drawn under reduced
 * motion and without JavaScript.
 */
function ScrollPath({ d = "wave", lane = "left", laneWidth = 0.4, range = { start: ["entry", 20], end: ["exit", 20] }, strokeWidth = 2, opacity = 0.5, className, children, style, ...props }: ScrollPathProps) {
  const path = d in scrollPathPresets ? scrollPathPresets[d as keyof typeof scrollPathPresets] : d;
  const root = React.useRef<HTMLDivElement>(null);
  const svg = React.useRef<SVGSVGElement>(null);
  const side = lane !== "full";
  const [size, setSize] = React.useState<[number, number] | null>(null);

  React.useLayoutEffect(() => {
    const el = svg.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      if (r.width && r.height) setSize([r.width, r.height]);
    };
    measure();
    const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(measure);
    observer?.observe(el);
    return () => observer?.disconnect();
  }, []);

  // Development only: the stroke's box against every box of text in the section.
  React.useEffect(() => {
    if (process.env.NODE_ENV === "production" || !root.current || !svg.current) return;
    const line = svg.current.getBoundingClientRect();
    const crossed = [...root.current.querySelectorAll<HTMLElement>("p, h1, h2, h3, h4, h5, h6, li, a, button, span, label")].filter((el) => {
      if (svg.current!.contains(el) || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent?.trim())) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.left < line.right && r.right > line.left && r.top < line.bottom && r.bottom > line.top;
    });
    if (crossed.length) console.warn(`ScrollPath: the line crosses text (${crossed.map((el) => el.textContent?.trim().slice(0, 24)).join(", ")}). Use lane="left" or "right".`);
  }, [lane, laneWidth, path]);

  return (
    <div
      ref={root}
      data-slot="scroll-path"
      data-lane={lane}
      className={cn("relative", side && "grid grid-cols-[var(--lane)_minmax(0,1fr)]", lane === "right" && "grid-cols-[minmax(0,1fr)_var(--lane)]", className)}
      style={{ "--lane": `${laneWidth * 100}%`, ...style } as React.CSSProperties}
      {...props}
    >
      <Draw range={range} aria-hidden="true" data-slot="scroll-path-lane" className={cn(side ? "relative min-h-full" : "pointer-events-none absolute inset-0", lane === "right" && "order-last")}>
        {/* Before it is measured (server, first paint) the 0–100 box is stretched; once measured it is drawn to size. */}
        <svg ref={svg} viewBox={size ? `0 0 ${size[0]} ${size[1]}` : "0 0 100 100"} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible text-accent" style={{ opacity }}>
          <path d={size ? fitPath(path, size[0], size[1]) : path} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
        </svg>
      </Draw>
      <div className={cn(!side && "relative")}>{children}</div>
    </div>
  );
}

export { ScrollPath };
