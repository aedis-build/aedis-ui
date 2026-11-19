"use client";

import * as React from "react";

import { sseBody, useDemoBackend } from "@/components/site/demo-backend";
import { useEventStream } from "@/registry/aedis/hooks/use-event-stream";
import { Badge } from "@/registry/aedis/ui/badge";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/registry/aedis/ui/table";
import { Toggle } from "@/registry/aedis/ui/toggle";

type Login = { at: string; who: string; method: string; result: string };

const people = ["Ana Souza", "Bruno Lima", "Carla Dias", "Diego Rocha", "Elisa Prado", "Fábio Nunes"];
const methods = ["Passkey", "Password + TOTP", "SSO"];
const logins: Login[] = Array.from({ length: 60 }, (_, i) => ({
  at: `09:${String(10 + Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "05"}`,
  who: people[i % people.length],
  method: methods[i % methods.length],
  result: i % 7 === 3 ? "Denied" : "Signed in",
}));

const plural = (n: number) => `${n} new event${n === 1 ? "" : "s"}`;

/**
 * useEventStream with `paused`: sign-ins arrive from a stream simulated in the page. Pausing holds new rows back and
 * counts them (at most 5 here, so dropping shows); resuming adds them in order. The table itself is not live: one
 * status line speaks once per pause and once per resume.
 */
export default function UseEventStreamLiveTable() {
  const [rows, setRows] = React.useState<(Login & { key: number })[]>([]);
  const [paused, setPaused] = React.useState(false);
  const [buffer, setBuffer] = React.useState({ buffered: 0, dropped: 0 });
  const [announcement, setAnnouncement] = React.useState("");
  const seq = React.useRef(0);

  useDemoBackend((req) =>
    new URL(req.url).pathname === "/demo-api/identity/logins"
      ? new Response(sseBody(logins.map((data) => ({ event: "login", data })), 900), { headers: { "content-type": "text/event-stream" } })
      : undefined,
  );
  const state = useEventStream<Login>("/demo-api/identity/logins", {
    events: ["login"],
    paused,
    maxBuffered: 5,
    onBuffer: setBuffer,
    onEvent: (login) => setRows((all) => [{ ...login, key: seq.current++ }, ...all].slice(0, 6)),
  });

  const toggle = (pause: boolean) => {
    // Read before resuming: the flush resets the count.
    const held = buffer.buffered + buffer.dropped;
    setPaused(pause);
    setAnnouncement(pause ? "Updates paused." : held ? `Updates resumed, ${plural(held)}.` : "Updates resumed.");
  };

  return (
    <div className="grid w-full max-w-xl gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant={paused ? "outline" : "accent"}>{paused ? "Paused" : state === "open" ? "Live" : "Connecting"}</Badge>
        <Toggle variant="outline" size="sm" pressed={paused} onPressedChange={toggle}>
          Pause updates
        </Toggle>
        {paused && (
          <span className="text-footnote text-muted-foreground">
            {plural(buffer.buffered + buffer.dropped)}
            {buffer.dropped ? `, ${buffer.dropped} older not kept` : ""}
          </span>
        )}
      </div>
      <p role="status" className="sr-only">
        {announcement}
      </p>
      <Table>
        <TableCaption>Recent sign-ins</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Time</TableHead>
            <TableHead>Person</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Result</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.key} className="motion-safe:animate-[aedis-fade-in_var(--duration-base)_ease-out]">
              <TableCell className="tabular-nums">{r.at}</TableCell>
              <TableCell>{r.who}</TableCell>
              <TableCell>{r.method}</TableCell>
              <TableCell>{r.result}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
