"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/registry/aedis/hooks/use-reduced-motion";
import { useMessages, type Messages } from "@/registry/aedis/lib/locale";
import { Button } from "@/registry/aedis/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/registry/aedis/ui/dialog";
import { MediaFrame, type MediaRatio } from "@/registry/aedis/ui/media-frame";

export type LightboxItem = { src: string; alt: string; title: string; caption?: string };

type LightboxProps = {
  items: LightboxItem[];
  /** Shape of the thumbnails. */
  ratio?: MediaRatio;
  /** The opened image grows from its thumbnail (FLIP). Never under reduced motion. */
  zoomFromThumbnail?: boolean;
  /** Classes for the grid of thumbnails. */
  className?: string;
  labels?: Partial<Messages["lightbox"]>;
};

/**
 * Thumbnails that open full screen in a Dialog: the item, its title and caption, previous and next (← →), a counter,
 * and Esc to close. The focus stays inside while it is open and goes back to the thumbnail that opened it.
 */
function Lightbox({ items, ratio = "4:5", zoomFromThumbnail = false, className, labels }: LightboxProps) {
  const l = useMessages("lightbox", labels);
  const reduced = useReducedMotion();
  const [open, setOpen] = React.useState(false);
  const [index, setIndex] = React.useState(0);
  const thumbs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const origin = React.useRef<HTMLButtonElement | null>(null);
  const image = React.useRef<HTMLImageElement>(null);
  const count = items.length;
  const item = items[index];
  const go = (i: number) => setIndex((i + count) % count);

  const show = (i: number) => {
    origin.current = thumbs.current[i] ?? null;
    setIndex(i);
    setOpen(true);
  };

  React.useEffect(() => {
    if (!open || !zoomFromThumbnail || reduced) return;
    const frame = requestAnimationFrame(() => {
      const img = image.current;
      const from = origin.current?.getBoundingClientRect();
      const to = img?.getBoundingClientRect();
      if (!img?.animate || !from || !to?.width || !to.height) return;
      const move = `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})`;
      img.animate([{ transform: move, transformOrigin: "top left" }, { transform: "none", transformOrigin: "top left" }], { duration: 380, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" });
    });
    return () => cancelAnimationFrame(frame);
    // Only on opening: moving between items does not fly from a thumbnail.
  }, [open]);

  return (
    <>
      <ul data-slot="lightbox" className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3", className)}>
        {items.map((it, i) => (
          <li key={it.src}>
            <button
              type="button"
              ref={(el) => void (thumbs.current[i] = el)}
              onClick={() => show(i)}
              className="block w-full rounded-md focus-ring"
            >
              <MediaFrame ratio={ratio} src={it.src} alt={it.alt} />
            </button>
          </li>
        ))}
      </ul>
      <Dialog open={open} onOpenChange={setOpen}>
        {item ? (
          <DialogContent
            finalFocus={origin}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") go(index + 1);
              else if (e.key === "ArrowLeft") go(index - 1);
              else if (e.key === "Tab") {
                // Wraps Tab at the edges itself: the dialog's focus guards let one press land outside it.
                const stops = [...e.currentTarget.querySelectorAll<HTMLElement>("button:not(:disabled)")];
                const at = stops.indexOf(document.activeElement as HTMLElement);
                if (e.shiftKey ? at <= 0 : at === stops.length - 1) {
                  e.preventDefault();
                  stops.at(e.shiftKey ? -1 : 0)?.focus();
                }
              }
            }}
            className="h-[calc(100dvh-2rem)] max-w-none grid-rows-[auto_minmax(0,1fr)_auto] gap-3 p-3 sm:max-w-none sm:p-4"
          >
            <div className="flex min-w-0 items-center gap-2">
              <DialogTitle className="truncate text-headline">{item.title}</DialogTitle>
              <span aria-live="polite" className="ml-auto shrink-0 text-footnote text-muted-foreground tabular-nums">
                {l.counter.replace("{index}", String(index + 1)).replace("{count}", String(count))}
              </span>
              <DialogClose render={<Button variant="ghost" size="icon" />} aria-label={l.close}>
                <svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </DialogClose>
            </div>
            <img ref={image} key={item.src} src={item.src} alt={item.alt} className="size-full min-h-0 object-contain" />
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="icon" aria-label={l.previous} onClick={() => go(index - 1)}>
                <svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M10 3.5L5.5 8l4.5 4.5" />
                </svg>
              </Button>
              <p className="min-w-0 flex-1 text-center text-callout text-muted-foreground">{item.caption}</p>
              <Button variant="secondary" size="icon" aria-label={l.next} onClick={() => go(index + 1)}>
                <svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M6 3.5L10.5 8 6 12.5" />
                </svg>
              </Button>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </>
  );
}

export { Lightbox };
