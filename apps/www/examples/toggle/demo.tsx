"use client";

import * as React from "react";

import { Toggle } from "@/registry/aedis/ui/toggle";

export default function ToggleDemo() {
  const [pinned, setPinned] = React.useState(false);
  return (
    <div className="flex flex-col items-center gap-3">
      <Toggle variant="outline" pressed={pinned} onPressedChange={setPinned}>
        <svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M6 2.5h4l-.5 4 2 2v1h-7v-1l2-2-.5-4zM8 9.5v4" />
        </svg>
        Pin to profile
      </Toggle>
      <p className="text-footnote text-muted-foreground">{pinned ? "Pinned: it shows first on the profile." : "Not pinned."}</p>
    </div>
  );
}
