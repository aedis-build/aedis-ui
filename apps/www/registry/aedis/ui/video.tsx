"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/registry/aedis/hooks/use-reduced-motion";
import { useMessages, type Messages } from "@/registry/aedis/lib/locale";
import { Button } from "@/registry/aedis/ui/button";

export type VideoCaptions = { src: string; srclang: string; label: string; default?: boolean };

type VideoProps = {
  /** A file on this origin or on one the CSP media-src allows (securityHeaders mediaSrc); no third-party embeds. */
  src: string;
  /** e.g. "video/webm" or "video/mp4". */
  type?: string;
  poster?: string;
  /** Names the player. A background video is decoration and is hidden from assistive technology. */
  title: string;
  captions?: VideoCaptions[];
  /** "background": muted, looped, inline, without controls but with a pause button; it fills its container. */
  variant?: "player" | "background";
  /** Off by default. On, it starts muted once in view, never under reduced motion. */
  autoplay?: boolean;
  className?: string;
  labels?: Partial<Messages["video"]>;
};

/**
 * A video that loads nothing until it is near the viewport (preload="none", the source attached on approach). The
 * player has the browser's controls and caption tracks; the background variant always shows a pause button while it
 * moves.
 */
function Video({ src, type, poster, title, captions = [], variant = "player", autoplay = false, className, labels }: VideoProps) {
  const l = useMessages("video", labels);
  const reduced = useReducedMotion();
  const video = React.useRef<HTMLVideoElement>(null);
  const [near, setNear] = React.useState(false);
  const [playing, setPlaying] = React.useState(false);
  const background = variant === "background";

  React.useEffect(() => {
    const el = video.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") return setNear(true);
    const observer = new IntersectionObserver(([e]) => e?.isIntersecting && (setNear(true), observer.disconnect()), { rootMargin: "200px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    // Browsers refuse to autoplay with sound, so autoplay is always muted; a refusal leaves the poster and the play button.
    if (near && autoplay && !reduced) video.current?.play?.()?.catch(() => {});
  }, [near, autoplay, reduced]);

  return (
    <div data-slot="video" data-variant={variant} className={cn("relative overflow-hidden rounded-md bg-muted", background ? "h-full min-h-48" : "aspect-video", className)}>
      <video
        ref={video}
        poster={poster}
        preload="none"
        controls={!background}
        muted={background || autoplay}
        loop={background}
        playsInline
        aria-label={background ? undefined : title}
        aria-hidden={background || undefined}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className="size-full object-cover"
      >
        {near ? <source src={src} type={type} /> : null}
        {captions.map((c) => (
          <track key={c.src} kind="captions" src={c.src} srcLang={c.srclang} label={c.label} default={c.default} />
        ))}
      </video>
      {background ? (
        <Button
          variant="secondary"
          size="icon"
          aria-label={playing ? l.pause : l.play}
          onClick={() => (playing ? video.current?.pause() : video.current?.play()?.catch(() => {}))}
          className="absolute right-3 bottom-3"
        >
          {playing ? (
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
      ) : null}
    </div>
  );
}

export { Video };
