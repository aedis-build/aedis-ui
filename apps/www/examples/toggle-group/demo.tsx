"use client";

import * as React from "react";

import { ToggleGroup, ToggleGroupItem } from "@/registry/aedis/ui/toggle-group";

const needs = [
  { value: "brand", label: "Brand identity" },
  { value: "site", label: "Website" },
  { value: "photo", label: "Photography" },
  { value: "video", label: "Video" },
];

export default function ToggleGroupDemo() {
  const [value, setValue] = React.useState<string[]>(["site"]);
  const label = React.useId();
  return (
    <div className="flex max-w-sm flex-col gap-3">
      <p id={label} className="text-callout font-medium">
        I need…
      </p>
      <ToggleGroup multiple variant="outline" aria-labelledby={label} value={value} onValueChange={setValue}>
        {needs.map((n) => (
          <ToggleGroupItem key={n.value} value={n.value}>
            {n.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <p className="text-footnote text-muted-foreground">{value.length ? `${value.length} chosen: ${value.join(", ")}` : "Nothing chosen yet."}</p>
    </div>
  );
}
