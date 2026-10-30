"use client";

import * as React from "react";

import { MediaFrame } from "@/registry/aedis/ui/media-frame";
import { Curtain, Dolly, Draw, Reveal, ScrollMotionProvider, ScrollTimeline } from "@/registry/aedis/ui/scroll-motion";

const subscribe = () => () => {};
const hasNative = () => "ViewTimeline" in window;

function Effects({ name }: { name: string }) {
  return (
    <div className="grid content-start gap-10" aria-label={name} role="group">
      <ScrollTimeline className="grid gap-2" range={{ start: ["entry", 0], end: ["exit", 100] }}>
        <p className="text-footnote text-muted-foreground">ScrollTimeline: --scroll-progress</p>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div data-part="bar" className="h-full origin-left rounded-full bg-primary" style={{ transform: "scaleX(var(--scroll-progress, 1))" }} />
        </div>
      </ScrollTimeline>
      <div className="grid gap-2">
        <p className="text-footnote text-muted-foreground">Curtain</p>
        <Curtain>
          <MediaFrame ratio="4:5" src="/media/work-2.svg" alt="Green signage by the greenhouse door" />
        </Curtain>
      </div>
      <div className="grid gap-2">
        <p className="text-footnote text-muted-foreground">Dolly</p>
        <Dolly className="rounded-md">
          <MediaFrame ratio="4:5" src="/media/work-4.svg" alt="Gold poster in a hotel lobby" />
        </Dolly>
      </div>
      <div className="grid gap-2">
        <p className="text-footnote text-muted-foreground">Draw</p>
        <Draw>
          <svg viewBox="0 0 200 120" aria-hidden="true" className="w-full text-primary">
            <path d="M10 100 C50 10, 90 10, 100 60 S150 110, 190 20" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          </svg>
        </Draw>
      </div>
      <div className="grid gap-2">
        <p className="text-footnote text-muted-foreground">Reveal blur</p>
        <Reveal blur className="rounded-md border border-hairline bg-surface p-4 text-headline">
          Out of the blur, into the light.
        </Reveal>
      </div>
    </div>
  );
}

export default function ScrollMotionEffects() {
  const native = React.useSyncExternalStore(subscribe, hasNative, () => true);
  return (
    <div className="grid w-full max-w-2xl gap-6 py-[30vh]">
      <p className="text-callout text-muted-foreground">
        Scroll: both columns move together. The left one runs on the browser&apos;s scroll timeline
        {native ? "" : " (not in this browser, so it falls back too)"}; the right one is forced onto the JavaScript loop.
      </p>
      <div className="grid grid-cols-2 gap-4 sm:gap-8">
        <Effects name="Native" />
        <ScrollMotionProvider fallback>
          <Effects name="Fallback" />
        </ScrollMotionProvider>
      </div>
    </div>
  );
}
