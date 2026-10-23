"use client";

import * as React from "react";

import { REMOTE_PATH, shellMessages } from "@/content/mf-demo";
import type { ThemeMode } from "@/registry/aedis/lib/custom-theme";
import type { Bridge, MessageSpec } from "@/registry/aedis/lib/mf-bridge";
import { PROTOCOL, VERSION } from "@/registry/aedis/lib/mf-bridge";
import { useMfContextHost } from "@/registry/aedis/lib/mf-context";
import { defineMfElement, type MfElementProps } from "@/registry/aedis/lib/mf-element";
import { Badge } from "@/registry/aedis/ui/badge";
import { Button } from "@/registry/aedis/ui/button";
import { Card } from "@/registry/aedis/ui/card";
import { MfFrame, RESIZE } from "@/registry/aedis/ui/mf-frame";
import { Tabs, TabsList, TabsTrigger } from "@/registry/aedis/ui/tabs";

type ShellBridge = Bridge<typeof shellMessages & { [RESIZE]: MessageSpec<{ height: number }> }>;
type Entry = { id: number; tone: "in" | "out" | "drop" | "error"; text: string };

/** The same-origin option: a React component as a Web Component, in a shadow root on the shell's own page. */
function UsageMeter({ used = 0, ceiling = 100, emit }: { used?: number; ceiling?: number } & MfElementProps) {
  const share = Math.min(100, Math.max(0, Math.round((used / Math.max(1, ceiling)) * 100)));
  return (
    <div className="meter">
      <span className="label">Usage · mf-element</span>
      <span className="value">{share}% of the ceiling</span>
      <span className="track"><span className="fill" style={{ width: `${share}%` }} /></span>
      <button type="button" onClick={() => emit("raise-ceiling", { by: 10 })}>Raise the ceiling</button>
    </div>
  );
}

const meterCss = `
.meter{display:flex;flex-direction:column;gap:6px;font:13px/1.4 system-ui,sans-serif;color:inherit}
.label{font-weight:600}.value{opacity:.75}
.track{display:block;height:6px;border-radius:999px;background:color-mix(in srgb,currentColor 15%,transparent);overflow:hidden}
.fill{display:block;height:100%;background:#2457d6;border-radius:999px}
button{align-self:flex-start;font:inherit;padding:4px 10px;border-radius:8px;border:1px solid color-mix(in srgb,currentColor 25%,transparent);background:transparent;color:inherit;cursor:pointer}
button:focus-visible{outline:2px solid #2457d6;outline-offset:2px}`;

/**
 * A shell and a remote talking over the kit, live: the remote reports its height, follows the shell's theme and
 * session, and says which invoice was selected; the log shows the bridge rejecting a forged message and a request
 * timing out when the remote hangs.
 */
export function MfDemoShell() {
  const [bridge, setBridge] = React.useState<ShellBridge | null>(null);
  const [mode, setMode] = React.useState<ThemeMode>("light");
  const [signedIn, setSignedIn] = React.useState(true);
  const [used, setUsed] = React.useState(72);
  const [log, setLog] = React.useState<Entry[]>([]);
  const [src, setSrc] = React.useState<string | null>(null);
  const meter = React.useRef<HTMLElement>(null);
  const next = React.useRef(0);

  const add = React.useCallback((tone: Entry["tone"], text: string) => setLog((l) => [{ id: next.current++, tone, text }, ...l].slice(0, 30)), []);

  React.useEffect(() => {
    setSrc(`${window.location.origin}${REMOTE_PATH}`);
    defineMfElement("aedis-usage-meter", UsageMeter, { attributes: { used: "number", ceiling: "number" }, events: ["raise-ceiling"], css: meterCss });
  }, []);

  const endSession = useMfContextHost(bridge, { mode, locale: "en" });

  React.useEffect(() => {
    if (!bridge) return;
    void bridge.ready.then(() => add("in", "Handshake: the remote is ready"));
    const offs = [
      bridge.on(RESIZE, ({ height }) => add("in", `Height: the remote reports ${Math.round(height)} px, the frame resizes`)),
      bridge.on("billing:invoice", ({ id, amount }) => add("in", `Invoice selected: ${id}, $${amount.toFixed(2)}`)),
    ];
    return () => offs.forEach((off) => off());
  }, [bridge, add]);

  React.useEffect(() => {
    if (bridge) add("out", `Theme sent: ${mode}`);
  }, [bridge, mode, add]);

  React.useEffect(() => {
    const el = meter.current;
    const raise = () => (setUsed((u) => Math.max(0, u - 10)), add("in", "mf-element emitted raise-ceiling"));
    el?.addEventListener("raise-ceiling", raise);
    return () => el?.removeEventListener("raise-ceiling", raise);
  }, [add, src]);

  async function status() {
    add("out", "Request: billing:status");
    try {
      const answer = await bridge!.request<{ open: number }>("billing:status", {});
      add("in", `Response: ${answer.open} open invoices`);
    } catch (error) {
      add("error", `Request failed: ${(error as Error).message}`);
    }
  }

  function forge() {
    add("out", "Forged: a resize posted by this page, not by the frame");
    // Same protocol and type, but its source is the shell's own window: the bridge must drop it.
    window.postMessage({ protocol: PROTOCOL, v: VERSION, kind: "event", type: RESIZE, payload: { height: 9999 } }, window.location.origin);
  }

  function hang() {
    bridge!.send("demo:hang", {});
    add("out", "Told the remote to hang; the next request waits for the timeout (5 s)");
    void status();
  }

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <Card className="gap-0 overflow-hidden p-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-hairline bg-background px-4 py-2.5">
          <span className="text-callout font-semibold">Shell</span>
          <span className="text-caption text-muted-foreground">session, header, CSP</span>
          <span className="ml-auto flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className={signedIn ? "text-success" : "text-destructive"}>{signedIn ? "Signed in" : "Signed out"}</Badge>
            <Tabs value={mode} onValueChange={(v) => setMode(v as ThemeMode)}>
              <TabsList aria-label="Shell theme">
                <TabsTrigger value="light">Light</TabsTrigger>
                <TabsTrigger value="dark">Dark</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button size="sm" variant="secondary" disabled={!signedIn || !bridge} onClick={() => (endSession(), setSignedIn(false), add("out", "Session ended: sent session:end"))}>
              Sign out
            </Button>
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 bg-background p-4 text-foreground md:grid-cols-[minmax(0,1fr)_13rem]">
          {src ? (
            <MfFrame
              src={src}
              title="Billing remote"
              messages={shellMessages}
              minHeight={160}
              maxHeight={600}
              onBridge={(b) => setBridge(b as unknown as ShellBridge)}
              onDrop={(reason) => add("drop", `Dropped by the bridge: ${reason}`)}
            />
          ) : (
            <div className="h-40" />
          )}
          <div className="rounded-md border border-hairline p-3">
            {React.createElement("aedis-usage-meter", { ref: meter, used: String(used), ceiling: "100" })}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 border-t border-hairline bg-background px-4 py-3">
          <Button size="sm" variant="secondary" disabled={!bridge} onClick={() => void status()}>Ask the remote for its status</Button>
          <Button size="sm" variant="secondary" onClick={forge}>Send a forged message</Button>
          <Button size="sm" variant="outline" className="text-destructive" disabled={!bridge} onClick={hang}>Make the remote hang</Button>
        </div>
      </Card>
      <Card className="gap-2 p-4">
        <h3 className="text-headline">Event log</h3>
        <ol aria-live="polite" aria-label="Bridge events" className="m-0 flex max-h-[26rem] list-none flex-col gap-1.5 overflow-y-auto p-0 text-footnote">
          {log.length ? null : <li className="text-muted-foreground">Waiting for the remote…</li>}
          {log.map((e) => (
            <li key={e.id} className="flex gap-2">
              <span aria-hidden="true" className={e.tone === "drop" || e.tone === "error" ? "text-destructive" : e.tone === "in" ? "text-success" : "text-link"}>
                {e.tone === "in" ? "←" : e.tone === "out" ? "→" : "✕"}
              </span>
              <span>{e.text}</span>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
