"use client";

import * as React from "react";
import { flushSync } from "react-dom";

import { safeUrl } from "@/lib/untrusted";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/registry/aedis/hooks/use-reduced-motion";
import { useMessages, type Messages } from "@/registry/aedis/lib/locale";
import { Button } from "@/registry/aedis/ui/button";
import { MediaFrame } from "@/registry/aedis/ui/media-frame";
import { Video, type VideoCaptions } from "@/registry/aedis/ui/video";

export type LayoutGridItem = {
  kind: "photo" | "film";
  /** The file the block links to, so the grid still opens without JavaScript. */
  src: string;
  /** Width over height, e.g. 3 / 2 or 9 / 16. Below 1 the piece is vertical. */
  ratio: number;
  /** Describes the picture. */
  alt: string;
  title: string;
  description?: string;
  /** A short tag over the title, e.g. "Lisbon". */
  label?: string;
  /** Film: e.g. "video/webm". */
  type?: string;
  /** Film: the still shown before it plays. */
  poster?: string;
  captions?: VideoCaptions[];
};

/**
 * Where a block sits on the three columns at 768 px and wider; `aspect` sets its height, without it the block fills its
 * row. `fit: "contain"` marks a vertical piece in a wide block: shown whole, never cropped.
 */
export type LayoutSlot = { column: string; row: string; aspect?: number; fit?: "contain" };

/**
 * Places pieces in order on three columns. Pairs alternate a wide block and a narrow one (2+1, then 1+2), the horizontal
 * piece of the pair taking the wide block. Three vertical pieces in a row make a group: a feature two columns wide and two
 * rows tall beside two stacked narrow blocks, the feature switching sides each group. A last piece alone takes the whole row
 * if horizontal, the middle column if vertical.
 */
export function layoutSlots(ratios: number[]): LayoutSlot[] {
  const slots: LayoutSlot[] = [];
  const vertical = (i: number) => ratios[i]! < 1;
  let row = 1;
  let pairs = 0;
  let groups = 0;
  for (let i = 0; i < ratios.length; ) {
    if (i + 2 < ratios.length && vertical(i) && vertical(i + 1) && vertical(i + 2)) {
      const [feature, narrow] = groups++ % 2 === 0 ? ["1 / span 2", "3"] : ["2 / span 2", "1"];
      slots.push({ column: feature, row: `${row} / span 2`, aspect: ratios[i]! }, { column: narrow, row: `${row}` }, { column: narrow, row: `${row + 1}` });
      row += 2;
      i += 3;
    } else if (i + 1 === ratios.length) {
      slots.push({ column: vertical(i) ? "2" : "1 / span 3", row: `${row}`, aspect: ratios[i]! });
      i += 1;
    } else {
      const [wide, narrow] = pairs++ % 2 === 0 ? ["1 / span 2", "3"] : ["2 / span 2", "1"];
      const w = vertical(i) && !vertical(i + 1) ? i + 1 : i;
      for (const j of [i, i + 1]) slots.push(j === w ? (vertical(j) ? { column: wide, row: `${row}`, aspect: 3 / 2, fit: "contain" } : { column: wide, row: `${row}`, aspect: ratios[j]! }) : { column: narrow, row: `${row}` });
      row += 1;
      i += 2;
    }
  }
  return slots;
}

type LayoutGridProps = {
  items: LayoutGridItem[];
  /** Groups several grids on one page. */
  chapter?: { number?: string; name: string; label?: string };
  className?: string;
  labels?: Partial<Messages["layoutGrid"]>;
};

const NAME = "layout-grid-card";

// A ratio that is not a positive number would break the layout; such a piece is treated as 3:2.
const normal = (r: number) => (Number.isFinite(r) && r > 0 ? r : 3 / 2);

// Only the film fields that are set: Video takes no undefined props.
const film = ({ type, poster, captions }: LayoutGridItem) => ({ ...(type && { type }), ...(poster && { poster }), ...(captions && { captions }) });

/**
 * A grid of photos and films that keeps each piece in a block of its own shape, and grows the block into a card in the
 * middle of the screen (a native modal dialog) with its title and description.
 */
function LayoutGrid({ items, chapter, className, labels }: LayoutGridProps) {
  const l = useMessages("layoutGrid", labels);
  const reduced = useReducedMotion();
  const dialog = React.useRef<HTMLDialogElement>(null);
  const card = React.useRef<HTMLDivElement>(null);
  const close = React.useRef<HTMLButtonElement>(null);
  const origin = React.useRef<HTMLAnchorElement | null>(null);
  // A drag that starts in the card and ends on the backdrop is not a click outside.
  const pressed = React.useRef(false);
  const [active, setActive] = React.useState<number | null>(null);
  const [aside, setAside] = React.useState(false);
  const id = React.useId();
  const ratios = items.map((i) => normal(i.ratio));
  const slots = layoutSlots(ratios);
  const item = active === null ? undefined : items[active];
  const ratio = active === null ? 3 / 2 : ratios[active]!;

  const open = (i: number, e: React.MouseEvent<HTMLAnchorElement>) => {
    // A modified click opens the file itself, like any link.
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    const block = e.currentTarget.parentElement!;
    origin.current = e.currentTarget;
    const show = () => {
      flushSync(() => setActive(i));
      dialog.current?.showModal();
      close.current?.focus();
    };
    if (reduced || !document.startViewTransition) return show();
    // One transient name: on the block in the old picture, on the card in the new one, gone once it has grown.
    block.style.viewTransitionName = NAME;
    document
      .startViewTransition(() => {
        block.style.viewTransitionName = "";
        show();
        if (card.current) card.current.style.viewTransitionName = NAME;
      })
      .finished.finally(() => card.current?.style.removeProperty("view-transition-name"))
      .catch(() => {});
  };

  React.useEffect(() => {
    // The copy steps aside a moment after the film starts, so the picture and its subtitles stay clear.
    const el = card.current;
    if (!el) return;
    let timer = 0;
    const play = () => (clearTimeout(timer), (timer = window.setTimeout(() => setAside(true), 1200)));
    const stop = () => (clearTimeout(timer), setAside(false));
    el.addEventListener("play", play, true);
    el.addEventListener("pause", stop, true);
    return () => {
      stop();
      el.removeEventListener("play", play, true);
      el.removeEventListener("pause", stop, true);
    };
  }, [active]);

  const vertical = !!item && ratio < 1;

  return (
    <section data-slot="layout-grid" aria-labelledby={chapter ? `${id}-chapter` : undefined} className={cn("w-full", className)}>
      {chapter ? (
        <header className="mb-4 flex items-baseline gap-3">
          {chapter.number ? <span className="text-footnote text-muted-foreground tabular-nums">{chapter.number}</span> : null}
          <h2 id={`${id}-chapter`} className="text-title-3">
            {chapter.name}
          </h2>
          {chapter.label ? <span className="ml-auto text-footnote text-muted-foreground">{chapter.label}</span> : null}
        </header>
      ) : null}
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {items.map((it, i) => {
          const slot = slots[i]!;
          const href = safeUrl(it.src);
          return (
            <li
              key={i}
              data-shape={ratios[i]! < 1 ? "vertical" : "horizontal"}
              style={{ "--ratio": ratios[i], "--md-ratio": slot.aspect ?? "auto", "--col": slot.column, "--row": slot.row } as React.CSSProperties}
              className="relative rounded-md [aspect-ratio:var(--ratio)] md:[aspect-ratio:var(--md-ratio)] md:[grid-column:var(--col)] md:[grid-row:var(--row)]"
            >
              {href ? (
                <a
                  href={href}
                  rel="noopener noreferrer"
                  onClick={(e) => open(i, e)}
                  aria-label={(it.kind === "film" ? l.film : l.photo).replace("{title}", it.title)}
                  className="absolute inset-0 z-1 rounded-md focus-ring"
                />
              ) : null}
              {it.kind === "film" ? (
                <Video variant="background" autoplay src={it.src} {...film(it)} title={it.title} fit={slot.fit ?? "cover"} className="absolute inset-0 min-h-0 [&_button]:z-2" />
              ) : (
                <MediaFrame decorative src={it.src} fit={slot.fit ?? "cover"} className="absolute inset-0 aspect-auto h-full" />
              )}
            </li>
          );
        })}
      </ul>
      <dialog
        ref={dialog}
        aria-labelledby={item ? `${id}-title` : undefined}
        onClose={() => {
          setActive(null);
          origin.current?.focus();
        }}
        // A click on the backdrop lands on the dialog itself; the card fills it.
        onPointerDown={(e) => (pressed.current = e.target === e.currentTarget)}
        onClick={(e) => {
          if (e.target === e.currentTarget && pressed.current) e.currentTarget.close();
          pressed.current = false;
        }}
        className="m-auto max-h-none max-w-none overflow-visible border-0 bg-transparent p-0 backdrop:bg-scrim"
      >
        {item ? (
          <div
            ref={card}
            data-slot="layout-grid-card"
            data-shape={vertical ? "vertical" : "horizontal"}
            style={{ "--ratio": ratio } as React.CSSProperties}
            className={cn("relative grid overflow-hidden rounded-lg bg-surface [--side:0px]", vertical && "md:grid-cols-[auto_18rem] md:[--side:18rem]")}
          >
            <div className="relative w-[min(calc(100vw-2rem-var(--side)),calc((100dvh-2rem)*var(--ratio)))] [aspect-ratio:var(--ratio)]">
              {item.kind === "film" ? (
                <Video src={item.src} {...film(item)} title={item.title} className="absolute inset-0 aspect-auto rounded-none" />
              ) : (
                // The description below already says what the picture shows, so it is not read twice.
                <img src={item.src} alt={item.description ? "" : item.alt} className="absolute inset-0 size-full object-cover" />
              )}
            </div>
            <div
              data-aside={aside || undefined}
              className={cn(
                "pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-media-scrim-strong to-transparent p-4 pt-16 text-on-media motion-safe:transition-[opacity,translate] motion-safe:duration-(--duration-base) data-aside:translate-y-2 data-aside:opacity-0",
                vertical && "md:pointer-events-auto md:static md:bg-none md:p-6 md:pt-16 md:text-foreground md:data-aside:translate-y-0 md:data-aside:opacity-100",
              )}
            >
              {item.label ? <p className="text-footnote uppercase tracking-wide">{item.label}</p> : null}
              <h2 id={`${id}-title`} className="text-title-3">
                {item.title}
              </h2>
              {item.description ? <p className="mt-1 text-callout">{item.description}</p> : null}
            </div>
            <Button ref={close} variant="secondary" size="icon" aria-label={l.close} onClick={() => dialog.current?.close()} className="absolute top-3 right-3 z-1">
              <svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </Button>
          </div>
        ) : null}
      </dialog>
    </section>
  );
}

export { LayoutGrid };
