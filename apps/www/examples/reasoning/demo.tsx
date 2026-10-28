"use client";

import * as React from "react";

import { Button } from "@/registry/aedis/ui/button";
import { Reasoning } from "@/registry/aedis/ui/reasoning";

const thought = `The client asked for a **Q3 report**. I will read the invoices first.

The tool returned \`{"apiKey": "sk-live-41f9", "rows": 412}\`. 412 rows is enough for a summary.`;

/** The agent's reasoning, collapsed: it streams with "Thinking…", then says how long it took. Secrets are redacted. */
export default function ReasoningDemo() {
  const [shown, setShown] = React.useState(thought.length);
  const streaming = shown < thought.length;
  React.useEffect(() => {
    if (!streaming) return;
    const t = setTimeout(() => setShown((n) => Math.min(thought.length, n + 12)), 60);
    return () => clearTimeout(t);
  }, [shown, streaming]);
  return (
    <div className="grid w-full max-w-md gap-3">
      <Reasoning streaming={streaming} durationMs={streaming ? undefined : 4200}>
        {thought.slice(0, shown)}
      </Reasoning>
      <Button variant="outline" size="sm" className="justify-self-start" onClick={() => setShown(0)}>
        Think again
      </Button>
    </div>
  );
}
