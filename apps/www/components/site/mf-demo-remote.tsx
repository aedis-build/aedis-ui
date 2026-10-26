"use client";

import * as React from "react";

import { invoices, remoteMessages } from "@/content/mf-demo";
import { applyTheme, type ThemeMode } from "@/registry/aedis/lib/custom-theme";
import { createBridge } from "@/registry/aedis/lib/mf-bridge";
import { Badge } from "@/registry/aedis/ui/badge";
import { Button } from "@/registry/aedis/ui/button";
import { observeContentHeight, RESIZE } from "@/registry/aedis/ui/mf-frame";

type Bridge = ReturnType<typeof createBridge<typeof remoteMessages>>;

/**
 * The billing remote of the demo, inside the shell's MfFrame. One bridge to the shell for everything: its height, the
 * shell's theme and session, a status request it answers (until told to hang) and the invoice the person selects.
 */
export function MfDemoRemote() {
  const bridge = React.useRef<Bridge | null>(null);
  const [mode, setMode] = React.useState<ThemeMode | null>(null);
  const [session, setSession] = React.useState(true);
  const [hanging, setHanging] = React.useState(false);
  const [selected, setSelected] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (window.parent === window) return;
    // The frame's own origin is opaque (sandboxed); the shell lives at this page's URL origin.
    const host = new URL(window.location.href).origin;
    const b = createBridge({ target: window.parent, origins: [host], messages: remoteMessages });
    bridge.current = b;
    let undo: (() => void) | undefined;
    let hang = false;
    let signedOut = false;
    const offs = [
      b.on("context:theme", ({ mode: m, theme }) => {
        undo?.();
        undo = theme ? applyTheme(theme, { mode: m }) : undefined;
        document.documentElement.dataset.theme = m;
        setMode(m);
      }),
      b.on("session:end", () => ((signedOut = true), setSession(false))),
      b.on("demo:hang", () => ((hang = true), setHanging(true))),
      // A hanging remote never answers: the shell's request runs into the bridge's timeout.
      b.handle("billing:status", () => {
        // After the shell ended the session, billing has nothing to say to anyone.
        if (signedOut) throw new Error("signed out");
        return hang ? new Promise(() => {}) : { open: invoices.length };
      }),
    ];
    // Content height, once per change: it can shrink, and the shell's log gets one entry per new height.
    let stop: (() => void) | undefined;
    let closed = false;
    void b.ready.then(() => {
      if (!closed) stop = observeContentHeight((height) => b.send(RESIZE, { height }));
    });
    return () => {
      closed = true;
      stop?.();
      offs.forEach((off) => off());
      undo?.();
      b.close();
    };
  }, []);

  return (
    <div className="space-y-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-headline">Billing</span>
        <span className="flex gap-1.5">
          <Badge variant="secondary">theme: {mode ?? "waiting"}</Badge>
          {hanging ? <Badge variant="destructive">hanging</Badge> : null}
        </span>
      </div>
      {session ? (
        <>
          <p className="text-footnote text-muted-foreground">Open invoices. Select one: the shell hears about it over the bridge.</p>
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            {invoices.map((i) => (
              <li key={i.id}>
                <Button
                  variant={selected === i.id ? "default" : "secondary"}
                  size="sm"
                  className="w-full justify-between"
                  onClick={() => {
                    setSelected(i.id);
                    bridge.current?.send("billing:invoice", i);
                  }}
                >
                  <span>{i.id}</span>
                  <span className="tabular-nums">${i.amount.toFixed(2)}</span>
                </Button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-callout" role="status">The shell ended the session; nothing from billing stays on screen.</p>
      )}
    </div>
  );
}
