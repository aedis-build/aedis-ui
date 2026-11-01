"use client";

import * as React from "react";

import { ImageStream, streamPath, type StreamPath } from "@/registry/aedis/ui/image-stream";

const images = ["/media/work-1.svg", "/media/work-2.svg", "/media/work-3.svg", "/media/work-4.svg"];
const knobs: { key: keyof StreamPath; label: string; min: number; max: number; step: number }[] = [
  { key: "fan", label: "Fan", min: 1, max: 4, step: 0.1 },
  { key: "railExit", label: "Rail at exit (cqw)", min: 60, max: 100, step: 1 },
  { key: "exitHeight", label: "Card at exit (cqw)", min: 24, max: 60, step: 1 },
  { key: "turnExit", label: "Turn at exit (°)", min: 0, max: 50, step: 1 },
];

export default function ImageStreamDemo() {
  const [path, setPath] = React.useState<Partial<StreamPath>>({});
  return (
    <div className="grid w-full max-w-3xl gap-4">
      <ImageStream
        images={images}
        path={path}
        className="rounded-md bg-media-mask"
        centre={<img src="/media/showreel-poster.svg" alt="" className="aspect-video w-full rounded-sm object-cover" />}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {knobs.map((k) => (
          <label key={k.key} className="grid gap-1 text-footnote text-muted-foreground">
            <span>
              {k.label}: <output className="font-mono text-foreground">{path[k.key] ?? streamPath[k.key]}</output>
            </span>
            <input
              type="range"
              aria-label={k.label}
              min={k.min}
              max={k.max}
              step={k.step}
              value={path[k.key] ?? streamPath[k.key]}
              onChange={(e) => setPath((p) => ({ ...p, [k.key]: Number(e.currentTarget.value) }))}
              className="focus-ring w-full accent-primary"
            />
          </label>
        ))}
      </div>
    </div>
  );
}
