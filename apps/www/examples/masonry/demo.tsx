"use client";

import * as React from "react";

import { Label } from "@/registry/aedis/ui/label";
import { Masonry } from "@/registry/aedis/ui/masonry";
import { MediaFrame, type MediaRatio } from "@/registry/aedis/ui/media-frame";
import { Switch } from "@/registry/aedis/ui/switch";

type Work = { href: string; poster?: string; alt: string; client: string; ratio: MediaRatio };

// In the order a portfolio stores them: by client.
const works: Work[] = [
  { href: "/media/work-1.svg", alt: "Ceramics studio, the shop sign", client: "Ceramics studio", ratio: "4:5" },
  { href: "/media/work-1.svg#mug", alt: "Ceramics studio, the mug stamp", client: "Ceramics studio", ratio: "1:1" },
  { href: "/media/work-1.svg#card", alt: "Ceramics studio, the business card", client: "Ceramics studio", ratio: "3:2" },
  { href: "/media/work-2.svg", alt: "Garden centre, the greenhouse door", client: "Garden centre", ratio: "2:3" },
  { href: "/media/work-2.svg#map", alt: "Garden centre, the wayfinding map", client: "Garden centre", ratio: "16:9" },
  { href: "/media/work-3.svg", alt: "Bakery, the home page on a phone", client: "Bakery", ratio: "4:5" },
  { href: "/media/showreel.webm", poster: "/media/showreel-poster.svg", alt: "Bakery, the opening film (video)", client: "Bakery", ratio: "16:9" },
  { href: "/media/work-4.svg", alt: "Hotel, the lobby poster", client: "Hotel", ratio: "9:16" },
  { href: "/media/work-4.svg#key", alt: "Hotel, the key card", client: "Hotel", ratio: "1:1" },
];

export default function MasonryDemo() {
  const [mixed, setMixed] = React.useState(true);
  return (
    <div className="grid w-full gap-4">
      <div className="flex items-center gap-2">
        <Switch id="masonry-mix" checked={mixed} onCheckedChange={setMixed} />
        <Label htmlFor="masonry-mix">Interleave by client</Label>
      </div>
      <Masonry aria-label="Work" items={works} itemKey={(w) => w.href} groupBy={mixed ? (w) => w.client : undefined}>
        {(w) => (
          <a href={w.href} className="block rounded-md focus-ring">
            <MediaFrame ratio={w.ratio} src={w.poster ?? w.href} alt={w.alt} />
          </a>
        )}
      </Masonry>
    </div>
  );
}
