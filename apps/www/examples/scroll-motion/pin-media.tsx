"use client";

import * as React from "react";

import { Button } from "@/registry/aedis/ui/button";
import { Pin, type PinHandle } from "@/registry/aedis/ui/scroll-motion";

const rooms = ["Entrance", "Ceramics", "Posters", "Film", "Shop"];

/** Pinned on wide screens only, with buttons that send the reader to a room by scrolling the page to its progress. */
export default function ScrollMotionPinMedia() {
  const pin = React.useRef<PinHandle>(null);
  const [pinned, setPinned] = React.useState(false);
  return (
    <div className="grid w-full max-w-xl gap-3">
      <nav aria-label="Rooms" className="flex flex-wrap gap-2">
        {rooms.map((room, i) => (
          <Button key={room} size="sm" variant="outline" onClick={() => pin.current?.scrollTo(i / (rooms.length - 1))}>
            {room}
          </Button>
        ))}
      </nav>
      <p role="status" className="text-footnote text-muted-foreground">
        {pinned ? "Pinned: this screen is at least 768 px wide." : "A plain section: narrow screen, reduced motion or no JavaScript."}
      </p>
      <Pin ref={pin} media="(min-width: 768px)" length={rooms.length - 1} onPinnedChange={setPinned} className="w-full">
        {(progress) => {
          const room = Math.min(rooms.length - 1, Math.round(progress * (rooms.length - 1)));
          return (
            <ol aria-label="Exhibition" className="flex h-full flex-col justify-center gap-2 py-6">
              {rooms.map((r, i) => (
                <li key={r} data-current={i === room || undefined} className="rounded-md border border-hairline px-4 py-3 text-headline text-muted-foreground data-current:border-primary data-current:text-foreground">
                  {r}
                </li>
              ))}
              <li aria-hidden="true" className="list-none text-footnote text-muted-foreground tabular-nums">
                {Math.round(progress * 100)}% through
              </li>
            </ol>
          );
        }}
      </Pin>
    </div>
  );
}
