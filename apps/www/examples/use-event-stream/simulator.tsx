"use client";

import * as React from "react";

import { sseBody, useDemoBackend } from "@/components/site/demo-backend";
import { useEventStream } from "@/registry/aedis/hooks/use-event-stream";
import { Label } from "@/registry/aedis/ui/label";
import { Switch } from "@/registry/aedis/ui/switch";

const lines = ["Reading the brief", "Drafting three directions", "Picking the strongest one"];

/** useEventStream against a stream simulated in the page: the switch opens it, and closing it ends the stream. */
export default function UseEventStreamSimulator() {
  const [enabled, setEnabled] = React.useState(false);
  const [messages, setMessages] = React.useState<string[]>([]);

  useDemoBackend((req) =>
    new URL(req.url).pathname === "/demo-api/conversations/42/events"
      ? new Response(sseBody(lines.map((text) => ({ event: "message", data: { text } }))), { headers: { "content-type": "text/event-stream" } })
      : undefined,
  );
  const state = useEventStream<{ text: string }>("/demo-api/conversations/42/events", {
    enabled,
    events: ["message"],
    maxRetries: 0,
    onEvent: (m) => {
      setMessages((all) => [...all, m.text]);
      // The agent is done: stop following, or the client would reconnect for more.
      if (m.text === lines.at(-1)) setEnabled(false);
    },
  });

  return (
    <div className="grid w-full max-w-md gap-4">
      <div className="flex items-center gap-2">
        <Switch id="ues-enabled" checked={enabled} onCheckedChange={(on) => (setEnabled(on), on && setMessages([]))} />
        <Label htmlFor="ues-enabled">Follow the agent</Label>
      </div>
      <p role="status" className="text-callout">
        Stream: {state}
      </p>
      <ol aria-label="Messages" className="grid gap-1 text-callout">
        {messages.map((m, i) => (
          <li key={i}>{m}</li>
        ))}
      </ol>
    </div>
  );
}
