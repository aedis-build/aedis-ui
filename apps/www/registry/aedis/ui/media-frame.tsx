"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

const RATIOS = { "1:1": "aspect-square", "4:5": "aspect-[4/5]", "3:2": "aspect-[3/2]", "16:9": "aspect-video", "21:9": "aspect-[21/9]" } as const;

export type MediaRatio = keyof typeof RATIOS;

/** What the image element receives; a framework image component takes the same props (e.g. next/image with `fill`). */
export type MediaImageProps = { src: string; alt: string; className: string; loading: "lazy"; decoding: "async"; onError: () => void };

/** Alt text is required; an empty alt only when the media is marked decorative. */
type Described = { alt: string; decorative?: false } | { alt?: never; decorative: true };

export type MediaFrameProps = Described & {
  /** The frame keeps this shape before the media loads, so nothing below it moves. */
  ratio?: MediaRatio;
  fit?: "cover" | "contain";
  /** Without it, or when it fails to load, the frame shows its placeholder. Same-origin or an origin the CSP img-src allows. */
  src?: string;
  /** Shown in the placeholder, e.g. "Photos coming soon". */
  caption?: string;
  /** Renders the image, e.g. `(props) => <Image {...props} fill sizes="33vw" />`. A plain img by default. */
  image?: (props: MediaImageProps) => React.ReactNode;
  className?: string;
};

/** A frame with a fixed aspect ratio for an image, with a labelled placeholder while the media is missing. */
function MediaFrame({ ratio = "3:2", fit = "cover", src, alt, decorative, caption, image, className }: MediaFrameProps) {
  const [failed, setFailed] = React.useState(false);
  const root = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    // An image that failed before hydration fired its error event before React listened for it.
    const img = root.current?.querySelector("img");
    setFailed(!!img && img.complete && img.naturalWidth === 0);
  }, [src]);
  const label = decorative ? "" : alt;
  return (
    <div ref={root} data-slot="media-frame" data-ratio={ratio} className={cn("relative w-full overflow-hidden rounded-md bg-muted", RATIOS[ratio], className)}>
      {src && !failed ? (
        (image ?? ((p) => <img {...p} />))({
          src,
          alt: label,
          className: cn("absolute inset-0 size-full", fit === "cover" ? "object-cover" : "object-contain"),
          loading: "lazy",
          decoding: "async",
          onError: () => setFailed(true),
        })
      ) : (
        <div
          data-slot="media-frame-placeholder"
          {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": caption ? `${alt}: ${caption}` : alt })}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center text-footnote text-muted-foreground"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <circle cx="9" cy="10" r="2" />
            <path d="M21 17l-5-5-9 8" />
          </svg>
          {caption ? <span>{caption}</span> : null}
        </div>
      )}
    </div>
  );
}

export { MediaFrame };
