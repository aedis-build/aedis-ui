"use client";

import * as React from "react";

import { Label } from "@/registry/aedis/ui/label";
import { ScrollMotionProvider } from "@/registry/aedis/ui/scroll-motion";
import { ScrollPath, scrollPathPresets } from "@/registry/aedis/ui/scroll-path";
import { Switch } from "@/registry/aedis/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/registry/aedis/ui/toggle-group";

const services = [
  ["Identity", "A mark, a type system and the rules that keep them together."],
  ["Campaigns", "Posters, films and the pages they point to."],
  ["Websites", "Fast, accessible sites the team can edit without us."],
  ["Packaging", "Boxes and labels that read from the shelf."],
];

export default function ScrollPathDemo() {
  const [lane, setLane] = React.useState(["left"]);
  const [line, setLine] = React.useState(["wave"]);
  const [fallback, setFallback] = React.useState(false);
  return (
    <div className="grid w-full max-w-2xl gap-6 py-[30vh]">
      <div className="grid gap-3 sm:grid-cols-[auto_auto_1fr] sm:items-center">
        <ToggleGroup variant="segmented" size="sm" aria-label="Lane" value={lane} onValueChange={setLane}>
          <ToggleGroupItem value="left">left</ToggleGroupItem>
          <ToggleGroupItem value="right">right</ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup variant="segmented" size="sm" aria-label="Line" value={line} onValueChange={setLine}>
          {Object.keys(scrollPathPresets).map((p) => (
            <ToggleGroupItem key={p} value={p}>
              {p}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <div className="flex items-center gap-2">
          <Switch id="path-fallback" checked={fallback} onCheckedChange={setFallback} />
          <Label htmlFor="path-fallback">JavaScript fallback</Label>
        </div>
      </div>
      <ScrollMotionProvider fallback={fallback}>
        <ScrollPath lane={lane[0] === "right" ? "right" : "left"} d={line[0] ?? "wave"} laneWidth={0.3} className="gap-6">
          <div className="grid gap-10 py-10">
            <p className="text-title-2">What we do</p>
            {services.map(([title, text]) => (
              <div key={title} className="grid gap-1">
                <p className="text-headline">{title}</p>
                <p className="text-callout text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </ScrollPath>
      </ScrollMotionProvider>
    </div>
  );
}
