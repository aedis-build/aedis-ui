"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export type ImageAccordionItem = {
  image: string;
  alt: string;
  /** The panel's name: vertical while closed, a heading-sized line while open. */
  label: string;
  /** A small line above the name, e.g. "01" or "Principle". */
  kicker?: string | undefined;
  text: string;
};

export type ImageAccordionProps = {
  items: ImageAccordionItem[];
  defaultOpen?: number | undefined;
  onOpenChange?: ((index: number) => void) | undefined;
  /** hover opens after a short intent delay; click waits for a press. Keyboard focus always opens. */
  openOn?: "hover" | "click" | undefined;
  /** The open panel never gets narrower than this, so its text stays readable. A CSS length; `cqi` is the row's width. */
  minOpen?: string | undefined;
  /** auto: a vertical stack below 768 px, a row from there up. */
  orientation?: "auto" | "horizontal" | "vertical" | undefined;
  className?: string | undefined;
  "aria-label"?: string | undefined;
};

// Long enough that sweeping the pointer across the row opens nothing on the way.
const INTENT_MS = 100;

/**
 * A row of picture panels: one open wide with its text, the others narrow with a vertical label. The width (or, as a
 * stack, the height) is what moves, so changing panels mid-way carries on from where it is. The text keeps one width
 * and fades in once there is room, so it never re-wraps while the panel grows.
 */
function ImageAccordion({ items, defaultOpen = 0, onOpenChange, openOn = "hover", minOpen = "min(440px, 56cqi)", orientation = "auto", className, ...props }: ImageAccordionProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  const intent = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const panels = React.useRef<(HTMLButtonElement | null)[]>([]);
  const id = React.useId();

  const show = (i: number) => {
    clearTimeout(intent.current);
    if (i === open) return;
    setOpen(i);
    onOpenChange?.(i);
  };
  React.useEffect(() => () => clearTimeout(intent.current), []);

  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    const last = items.length - 1;
    const next = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: last }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    panels.current[Math.min(last, Math.max(0, next))]?.focus();
  };

  const row = orientation === "horizontal" ? "flex-row" : orientation === "vertical" ? "flex-col" : "flex-col md:flex-row";
  // Each orientation sizes the panels on its own axis; auto takes the vertical sizes below md and the row's from md up.
  const sizes = {
    horizontal: "min-w-0 grow basis-0 data-open:grow-[7] data-open:min-w-(--min-open)",
    vertical: "h-16 shrink-0 data-open:h-[52svh]",
    auto: "h-16 shrink-0 data-open:h-[52svh] md:h-auto md:shrink md:min-w-0 md:grow md:basis-0 md:data-open:h-auto md:data-open:grow-[7] md:data-open:min-w-(--min-open)",
  }[orientation];
  const textWidth = { horizontal: "w-[calc(var(--min-open)-3rem)]", vertical: "w-full", auto: "w-full md:w-[calc(var(--min-open)-3rem)]" }[orientation];

  return (
    <div
      data-slot="image-accordion"
      data-orientation={orientation}
      role="group"
      className={cn("@container flex w-full gap-2", row, orientation !== "vertical" && "md:h-[30rem]", orientation === "horizontal" && "h-[30rem]", className)}
      style={{ "--min-open": minOpen } as React.CSSProperties}
      {...props}
    >
      {items.map((item, i) => {
        const isOpen = i === open;
        return (
          <button
            key={i}
            ref={(el) => {
              panels.current[i] = el;
            }}
            type="button"
            data-slot="image-accordion-panel"
            data-open={isOpen ? "" : undefined}
            aria-expanded={isOpen}
            aria-labelledby={`${id}-${i}-label`}
            aria-describedby={`${id}-${i}-text ${id}-${i}-image`}
            tabIndex={isOpen ? 0 : -1}
            onClick={() => show(i)}
            onFocus={() => show(i)}
            onKeyDown={(e) => onKeyDown(e, i)}
            onPointerEnter={(e) => {
              if (openOn !== "hover" || e.pointerType === "touch") return;
              clearTimeout(intent.current);
              intent.current = setTimeout(() => show(i), INTENT_MS);
            }}
            onPointerLeave={() => clearTimeout(intent.current)}
            className={cn(
              "group focus-ring relative cursor-pointer overflow-hidden rounded-md bg-muted text-left text-on-media",
              "transition-[flex-grow,min-width,height] duration-(--duration-spring) ease-(--ease-cinematic) motion-reduce:transition-none",
              sizes,
            )}
          >
            <img id={`${id}-${i}-image`} src={item.image} alt={item.alt} loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />
            {/* The scrims keep the white text at 4.5:1 or more even over a white photograph. */}
            <span aria-hidden="true" className="absolute inset-0 bg-media-scrim transition-opacity duration-(--duration-base) group-data-open:opacity-0 motion-reduce:transition-none" />
            <span aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-media-scrim-strong via-media-scrim via-55% to-transparent opacity-0 transition-opacity duration-(--duration-base) group-data-open:opacity-100 motion-reduce:transition-none" />
            <span
              aria-hidden="true"
              className={cn(
                "absolute inset-0 flex items-center justify-start px-5 text-callout font-medium whitespace-nowrap transition-opacity duration-(--duration-fast) group-data-open:opacity-0 motion-reduce:transition-none",
                orientation === "horizontal" && "justify-center [writing-mode:vertical-rl] rotate-180 px-0 py-5",
                orientation === "auto" && "md:justify-center md:[writing-mode:vertical-rl] md:rotate-180 md:px-0 md:py-5",
              )}
            >
              {item.label}
            </span>
            <span
              className={cn(
                "absolute bottom-0 left-0 grid gap-1.5 p-6 opacity-0 translate-y-2 transition-[opacity,translate] duration-(--duration-press) ease-(--ease-out)",
                "group-data-open:translate-y-0 group-data-open:opacity-100 group-data-open:delay-150 group-data-open:duration-(--duration-base) motion-reduce:transition-none",
                textWidth,
              )}
            >
              {item.kicker ? <span className="text-caption font-semibold tracking-wide uppercase opacity-80">{item.kicker}</span> : null}
              <span id={`${id}-${i}-label`} className="text-title-2">{item.label}</span>
              <span id={`${id}-${i}-text`} className="max-w-prose text-callout opacity-90">{item.text}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export { ImageAccordion };
