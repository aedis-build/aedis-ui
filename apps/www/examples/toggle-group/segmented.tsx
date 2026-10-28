"use client";

import * as React from "react";

import { ToggleGroup, ToggleGroupItem } from "@/registry/aedis/ui/toggle-group";

export default function ToggleGroupSegmented() {
  const [value, setValue] = React.useState<string[]>(["photos"]);
  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <ToggleGroup variant="segmented" aria-label="Show" value={value} onValueChange={setValue} className="w-full">
        <ToggleGroupItem value="photos">Photos</ToggleGroupItem>
        <ToggleGroupItem value="videos">Videos</ToggleGroupItem>
      </ToggleGroup>
      <p className="text-footnote text-muted-foreground">Showing {value[0]}.</p>
    </div>
  );
}
