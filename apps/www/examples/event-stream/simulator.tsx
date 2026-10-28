"use client";

import * as React from "react";

import { sseBody, useDemoBackend } from "@/components/site/demo-backend";
import { connectEventStream, type EventStreamState } from "@/registry/aedis/lib/event-stream";
import { Button } from "@/registry/aedis/ui/button";
import { Progress } from "@/registry/aedis/ui/progress";

/** connectEventStream against a stream simulated in the page: a task reporting its progress, then done. */
export default function EventStreamSimulator() {
  const [state, setState] = React.useState<EventStreamState | "idle">("idle");
  const [value, setValue] = React.useState(0);
  const close = React.useRef<() => void>(() => {});

  useDemoBackend((req) =>
    new URL(req.url).pathname === "/demo-api/tasks/7/events"
      ? new Response(sseBody([25, 50, 75, 100].map((p) => ({ event: "progress", data: { percent: p } }))), { headers: { "content-type": "text/event-stream" } })
      : undefined,
  );
  React.useEffect(() => () => close.current(), []);
  // An SSE client reconnects when the server ends the stream; this task is over at 100%, so the page closes it.
  const stop = () => {
    close.current();
    setState("closed");
  };

  function connect() {
    close.current();
    setValue(0);
    close.current = connectEventStream<{ percent: number }>("/demo-api/tasks/7/events", {
      events: ["progress"],
      maxRetries: 0,
      onEvent: (p) => {
        setValue(p.percent);
        if (p.percent === 100) stop();
      },
      onState: setState,
    }).close;
  }

  return (
    <div className="grid w-full max-w-md gap-4">
      <div className="flex gap-2">
        <Button onClick={connect}>Start the task</Button>
        <Button variant="outline" onClick={stop}>
          Close
        </Button>
      </div>
      <Progress value={value} aria-label="Task progress" />
      <p role="status" className="text-callout">
        Stream: {state} · {value}%
      </p>
    </div>
  );
}
