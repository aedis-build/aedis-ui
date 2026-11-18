"use client";

import * as React from "react";
import { flushSync } from "react-dom";

import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/registry/aedis/hooks/use-reduced-motion";
import { useMessages, type Messages } from "@/registry/aedis/lib/locale";
import { Button } from "@/registry/aedis/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/registry/aedis/ui/dialog";
import { MediaFrame, type MediaRatio } from "@/registry/aedis/ui/media-frame";
import { Video, type VideoCaptions } from "@/registry/aedis/ui/video";

type LightboxBase = { src: string; alt: string; title: string; caption?: string };

/**
 * A photo. With srcSet the browser picks the file that fits, in the thumbnail (by the Lightbox's thumbSizes) and when
 * open (by sizes, "100vw" by default). width and height are the photo's own size, a hint for the browser.
 */
export type LightboxImage = LightboxBase & { kind?: "image"; srcSet?: string; sizes?: string; width?: number; height?: number };

/**
 * A film, opened in the Video player with its controls; it plays only when the person presses play. width and height
 * are its frame size (16:9 when left out): the player takes that shape, so its controls sit on the picture.
 */
export type LightboxVideo = LightboxBase & { kind: "video"; poster: string; type?: string; captions?: VideoCaptions[]; width?: number; height?: number };

export type LightboxItem = LightboxImage | LightboxVideo;

/** Only the file, type, poster and caption tracks reach the player: extra keys in item data (autoplay, variant) never do. */
const film = ({ src, poster, type, captions }: LightboxVideo) => ({ src, poster, ...(type ? { type } : {}), ...(captions ? { captions } : {}) });

/** The view-transition-name the thumbnail and the open item share, each only for the length of one transition. */
const MORPH = "lightbox-item";
/** How far down, in px, the open item has to be dragged to close it. */
const DISMISS = 120;


type LightboxProps = {
  items: LightboxItem[];
  /** Shape of the thumbnails. */
  ratio?: MediaRatio;
  /** The `sizes` of the thumbnails, for items with a srcSet. The default fits the grid at full width; say less when it is narrower. */
  thumbSizes?: string;
  /**
   * The open item grows out of its thumbnail and shrinks back into it on closing (View Transitions). Where the browser
   * has no document.startViewTransition, and under reduced motion, it simply appears.
   */
  zoomFromThumbnail?: boolean;
  /** Behind the open item: the solid scrim, or the page blurred under it. */
  backdrop?: "solid" | "blur";
  /** Classes for the grid of thumbnails. */
  className?: string;
  labels?: Partial<Messages["lightbox"]>;
};

/**
 * Thumbnails that open full screen in a Dialog: the item, its title and caption, previous and next (← →), a counter,
 * and Esc to close; dragging the item down past 120 px closes it too. The focus stays inside while it is open and goes
 * back to the thumbnail that opened it.
 */
function Lightbox({ items, ratio = "4:5", thumbSizes = "(min-width: 640px) 33vw, 50vw", zoomFromThumbnail = false, backdrop = "solid", className, labels }: LightboxProps) {
  const l = useMessages("lightbox", labels);
  const reduced = useReducedMotion();
  const [open, setOpen] = React.useState(false);
  const [index, setIndex] = React.useState(0);
  const thumbs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const origin = React.useRef<HTMLButtonElement | null>(null);
  const media = React.useRef<HTMLDivElement>(null);
  const stage = React.useRef<HTMLDivElement>(null);
  const overlay = React.useRef<HTMLDivElement>(null);
  const drag = React.useRef<{ id: number; y: number; dy: number } | null>(null);
  // The thumbnail the person already saw, shown behind the large image until it loads.
  const [behind, setBehind] = React.useState<string>();
  const [loaded, setLoaded] = React.useState(false);
  const count = items.length;
  const item = items[index];

  const select = (i: number) => {
    // The film leaves the page with its item, which stops it; pausing first also covers the dialog's closing animation.
    stage.current?.querySelector("video")?.pause?.();
    const thumb = thumbs.current[i]?.querySelector("img");
    setBehind(thumb ? thumb.currentSrc || thumb.getAttribute("src") || undefined : undefined);
    setLoaded(false);
    setIndex(i);
  };
  const go = (i: number) => select((i + count) % count);

  // Shared element: the name sits on the thumbnail before the change and on the open item after it (the reverse on closing).
  const morph = (opening: boolean, update: () => void) => {
    const thumb = origin.current;
    if (!zoomFromThumbnail || reduced || !thumb || typeof document.startViewTransition !== "function") return update();
    const name = (el: HTMLElement | null, on: boolean) => void (el && (el.style.viewTransitionName = on ? MORPH : ""));
    name(opening ? thumb : media.current, true);
    const clear = () => (name(thumb, false), name(media.current, false));
    document
      .startViewTransition(() => {
        name(opening ? thumb : media.current, false);
        // The dialog fades out after closing: its copy of the item hides, so only the one flying back is seen.
        if (!opening && stage.current) stage.current.style.visibility = "hidden";
        flushSync(update);
        name(opening ? media.current : thumb, true);
      })
      .finished.then(clear, clear);
  };

  const show = (i: number) => {
    origin.current = thumbs.current[i] ?? null;
    morph(true, () => {
      select(i);
      setOpen(true);
    });
  };
  const toggle = (next: boolean) => {
    if (next) return setOpen(true);
    stage.current?.querySelector("video")?.pause?.();
    morph(false, () => setOpen(false));
  };

  // Drag down to close: the item follows the pointer and the backdrop fades with the distance; short of DISMISS it springs back.
  const release = (e: React.PointerEvent, done: boolean) => {
    const d = drag.current;
    if (d?.id !== e.pointerId) return;
    drag.current = null;
    if (overlay.current) overlay.current.style.opacity = "";
    if (done && d.dy > DISMISS) return toggle(false);
    const el = media.current;
    if (el) Object.assign(el.style, { transition: "translate var(--duration-spring) var(--ease-spring-bouncy)", translate: "" });
  };

  return (
    <>
      <ul data-slot="lightbox" className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3", className)}>
        {items.map((it, i) => (
          <li key={it.src}>
            <button
              type="button"
              ref={(el) => void (thumbs.current[i] = el)}
              onClick={() => show(i)}
              className="relative block w-full rounded-md focus-ring"
            >
              {it.kind === "video" ? (
                <>
                  <MediaFrame ratio={ratio} src={it.poster} alt={it.alt} />
                  <span className="sr-only">{l.video}</span>
                  <span aria-hidden="true" className="absolute inset-0 grid place-items-center">
                    {/* The media tokens stay the same in both themes: the poster is any picture, light or dark. */}
                    <span className="grid size-10 place-items-center rounded-full bg-media-scrim text-on-media shadow-elevation-1 ring-1 ring-on-media/40">
                      <svg viewBox="0 0 16 16" className="size-4" fill="currentColor">
                        <path d="M5 3.5v9l7.5-4.5z" />
                      </svg>
                    </span>
                  </span>
                </>
              ) : (
                <MediaFrame
                  ratio={ratio}
                  src={it.src}
                  alt={it.alt}
                  image={(p) => <img {...p} srcSet={it.srcSet} sizes={it.srcSet ? thumbSizes : undefined} />}
                />
              )}
            </button>
          </li>
        ))}
      </ul>
      <Dialog open={open} onOpenChange={toggle}>
        {item ? (
          <DialogContent
            finalFocus={origin}
            overlay={{ ref: overlay, ...(backdrop === "blur" ? { className: "backdrop-blur-(--blur-regular)" } : {}) }}
            onKeyDown={(e) => {
              // In the player the arrows seek and change the volume; they do not move to another item there.
              const inPlayer = (e.target as HTMLElement).closest?.("video");
              if (e.key === "ArrowRight" && !inPlayer) go(index + 1);
              else if (e.key === "ArrowLeft" && !inPlayer) go(index - 1);
              else if (e.key === "Tab") {
                // Wraps Tab at the edges itself: the dialog's focus guards let one press land outside it.
                const stops = [...e.currentTarget.querySelectorAll<HTMLElement>("button:not(:disabled), video[controls]")];
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
            <div
              ref={stage}
              data-slot="lightbox-stage"
              // Vertical moves are the drag's; sideways panning and pinch zoom stay the browser's.
              className="relative min-h-0 touch-pan-x touch-pinch-zoom select-none"
              onPointerDown={(e) => {
                // The player's controls keep their presses: the drag starts only off the film.
                if (e.button !== 0 || (e.target as Element).closest("video")) return;
                e.currentTarget.setPointerCapture?.(e.pointerId);
                drag.current = { id: e.pointerId, y: e.clientY, dy: 0 };
              }}
              onPointerMove={(e) => {
                const d = drag.current;
                if (d?.id !== e.pointerId) return;
                d.dy = Math.max(0, e.clientY - d.y);
                // Under reduced motion nothing follows the pointer; letting go past DISMISS still closes.
                if (reduced) return;
                if (media.current) Object.assign(media.current.style, { transition: "none", translate: `0 ${d.dy}px` });
                if (overlay.current) overlay.current.style.opacity = String(Math.max(0, 1 - d.dy / (DISMISS * 3)));
              }}
              onPointerUp={(e) => release(e, true)}
              onPointerCancel={(e) => release(e, false)}
            >
              {item.kind === "video" ? (
                <div key={item.src} ref={media} data-slot="lightbox-media" className="absolute inset-0 grid place-items-center" style={{ containerType: "size" }}>
                  <div
                    data-slot="lightbox-player"
                    className="rounded-md [&_video]:outline-none has-[video:focus-visible]:ring-2 has-[video:focus-visible]:ring-ring has-[video:focus-visible]:ring-offset-2 has-[video:focus-visible]:ring-offset-surface"
                    style={{ aspectRatio: `${item.width ?? 16} / ${item.height ?? 9}`, width: `min(100cqw, 100cqh * ${(item.width ?? 16) / (item.height ?? 9)})` }}
                  >
                    <Video {...film(item)} title={item.alt} fit="contain" className="aspect-auto size-full" />
                  </div>
                </div>
              ) : (
                <div key={item.src} ref={media} data-slot="lightbox-media" className="absolute inset-0">
                  {behind && !loaded ? (
                    <img data-slot="lightbox-behind" src={behind} alt="" aria-hidden="true" draggable={false} className="absolute inset-0 size-full object-contain" />
                  ) : null}
                  <img
                    src={item.src}
                    srcSet={item.srcSet}
                    sizes={item.srcSet ? (item.sizes ?? "100vw") : undefined}
                    width={item.width}
                    height={item.height}
                    alt={item.alt}
                    // A mouse drag moves the item; the browser's own image drag would cancel it.
                    draggable={false}
                    onLoad={() => setLoaded(true)}
                    // A failed file shows its alt, not the stretched thumbnail.
                    onError={() => setLoaded(true)}
                    className="absolute inset-0 size-full object-contain"
                  />
                </div>
              )}
            </div>
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
