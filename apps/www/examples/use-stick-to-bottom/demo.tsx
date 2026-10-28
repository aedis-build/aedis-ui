"use client";

import * as React from "react";

import { useStickToBottom } from "@/registry/aedis/hooks/use-stick-to-bottom";
import { Button } from "@/registry/aedis/ui/button";

/** A log that follows new lines while you are at its end, and stays put once you scroll up to read. */
export default function UseStickToBottomDemo() {
  const { ref, atBottom, jump } = useStickToBottom<HTMLOListElement>();
  const [lines, setLines] = React.useState(() => Array.from({ length: 12 }, (_, i) => `Event ${i + 1}`));
  const add = () => setLines((l) => [...l, `Event ${l.length + 1}`]);
  return (
    <div className="grid w-full max-w-sm gap-3">
      <ol ref={ref} tabIndex={0} aria-label="Agent events" className="h-40 overflow-y-auto rounded-md border border-hairline bg-surface p-3 text-callout focus-ring">
        {lines.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ol>
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={add}>Add an event</Button>
        {atBottom ? null : (
          <Button variant="outline" onClick={jump}>
            Jump to latest
          </Button>
        )}
      </div>
      <p role="status" className="text-footnote text-muted-foreground">
        {atBottom ? "Following the end." : "Reading back: new events do not move the log."}
      </p>
    </div>
  );
}
