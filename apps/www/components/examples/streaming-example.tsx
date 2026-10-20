"use client";

import * as React from "react";

import { Button } from "@/registry/aedis/ui/button";
import { StreamingMarkdown } from "@/registry/aedis/ui/streaming-markdown";

const ANSWER =
  "Here is the **proposal** for Acme Bistro:\n\n- 4 shoot days a month\n- Delivery in 48 hours\n\nTerms are in [the contract](https://example.com/contract). Approve it in the card below.";

/** Replays an answer a few characters at a time, like an agent streaming tokens. */
export function StreamingExample() {
  const [text, setText] = React.useState("");
  const [streaming, setStreaming] = React.useState(false);

  React.useEffect(() => {
    if (!streaming) return;
    const t = setInterval(() => {
      setText((s) => {
        const next = ANSWER.slice(0, s.length + 3);
        if (next.length === ANSWER.length) setStreaming(false);
        return next;
      });
    }, 40);
    return () => clearInterval(t);
  }, [streaming]);

  return (
    <div className="space-y-4">
      <Button variant="outline" onClick={() => (setText(""), setStreaming(true))} disabled={streaming}>
        Stream an answer
      </Button>
      <StreamingMarkdown streaming={streaming} className="min-h-24 text-callout">
        {text}
      </StreamingMarkdown>
    </div>
  );
}
