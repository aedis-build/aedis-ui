"use client";

import { Pin } from "@/registry/aedis/ui/scroll-motion";

const words = ["Listen", "Sketch", "Ship"];

export default function ScrollMotionPin() {
  return (
    <Pin length={1.5} className="w-full max-w-xl">
      {(progress) => (
        <div className="flex h-full flex-col items-center justify-center gap-4">
          <p className="text-title-1">{words[Math.min(words.length - 1, Math.floor(progress * words.length))]}</p>
          <div className="h-1 w-48 overflow-hidden rounded-full bg-muted" aria-hidden="true">
            <div className="h-full origin-left bg-primary" style={{ transform: `scaleX(${progress})` }} />
          </div>
          <p className="text-footnote text-muted-foreground tabular-nums">{Math.round(progress * 100)}% through</p>
        </div>
      )}
    </Pin>
  );
}
