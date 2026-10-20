"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { allowedOrigins, createBridge, type Bridge, type MessageSpec } from "@/registry/aedis/lib/mf-bridge";
import { Skeleton } from "@/registry/aedis/ui/skeleton";

/** Sandbox tokens a frame may get. Everything else (allow-top-navigation, allow-popups-to-escape-sandbox…) is dropped. */
const TOKENS = [
  "allow-scripts",
  "allow-forms",
  "allow-popups",
  "allow-modals",
  "allow-downloads",
  "allow-same-origin",
  "allow-top-navigation-by-user-activation",
  "allow-storage-access-by-user-activation",
] as const;
export type SandboxToken = (typeof TOKENS)[number];

export const RESIZE = "mf:resize";
const isHeight = (p: unknown): p is { height: number } => typeof p === "object" && p !== null && Number.isFinite((p as { height?: unknown }).height);
const frameMessages = { [RESIZE]: { validate: isHeight } as MessageSpec<{ height: number }> };

/**
 * The sandbox to apply. allow-same-origin is refused when the frame has this page's origin: together with
 * allow-scripts it would let the frame remove its own sandbox.
 */
export function frameSandbox(tokens: readonly string[], frameOrigin: string, hostOrigin: string) {
  const known = tokens.filter((t): t is SandboxToken => (TOKENS as readonly string[]).includes(t));
  return [...new Set(known.filter((t) => !(t === "allow-same-origin" && frameOrigin === hostOrigin)))];
}

export type MfFrameProps = {
  /** The embedded app, an absolute http(s) URL. Its origin is the only one the frame's bridge accepts. */
  src: string;
  /** Required: what the frame contains, for assistive technology. */
  title: string;
  /** Minimal by default: scripts and forms. */
  sandbox?: SandboxToken[];
  /** Permissions policy for the frame; empty by default (no camera, microphone, geolocation…). */
  allow?: string;
  referrerPolicy?: React.HTMLAttributeReferrerPolicy;
  /** Bounds for the height the embedded app reports. */
  minHeight?: number;
  maxHeight?: number;
  /** The bridge to the embedded app, for its own messages (add their specs in `messages`). */
  onBridge?: (bridge: Bridge<Record<string, MessageSpec>>) => void;
  messages?: Record<string, MessageSpec>;
  className?: string;
};

/** The host side of an embed: a sandboxed iframe sized by the embedded app over mf-bridge. */
function MfFrame({ src, title, sandbox = ["allow-scripts", "allow-forms"], allow = "", referrerPolicy = "strict-origin-when-cross-origin", minHeight = 120, maxHeight = 4000, onBridge, messages, className }: MfFrameProps) {
  const frame = React.useRef<HTMLIFrameElement>(null);
  // The host origin is only known in the browser, and the sandbox depends on it: render the frame after mount.
  const [host, setHost] = React.useState<string | null>(null);
  React.useEffect(() => setHost(window.location.origin), []);
  const extra = React.useRef(messages);
  const [height, setHeight] = React.useState(minHeight);
  const [loaded, setLoaded] = React.useState(false);
  const url = React.useMemo(() => {
    try {
      const u = new URL(src);
      return u.protocol === "https:" || u.protocol === "http:" ? u : null;
    } catch {
      return null;
    }
  }, [src]);
  const origin = url ? allowedOrigins([url.origin])[0] ?? null : null;
  const tokens = origin && host ? frameSandbox(sandbox, origin, host) : [];
  const handler = React.useRef(onBridge);
  handler.current = onBridge;

  React.useEffect(() => {
    if (!origin || !host) return;
    const bridge = createBridge({ target: () => frame.current?.contentWindow ?? null, origins: [origin], messages: { ...extra.current, ...frameMessages } });
    const off = bridge.on(RESIZE, ({ height: h }) => setHeight(Math.min(maxHeight, Math.max(minHeight, Math.round(h)))));
    void bridge.ready.then(() => setLoaded(true));
    handler.current?.(bridge as unknown as Bridge<Record<string, MessageSpec>>);
    return () => {
      off();
      bridge.close();
    };
  }, [origin, host, minHeight, maxHeight]);

  if (!url || !origin) return null;
  return (
    <div data-slot="mf-frame" className={cn("relative overflow-hidden rounded-md border border-hairline bg-surface", className)}>
      {!loaded ? <Skeleton className="absolute inset-0 rounded-none" /> : null}
      {host ? (
      <iframe
        ref={frame}
        src={url.href}
        title={title}
        sandbox={tokens.join(" ")}
        allow={allow}
        referrerPolicy={referrerPolicy}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        style={{ height }}
        className={cn(
          "block w-full border-0 transition-[height,opacity] duration-(--duration-spring) ease-spring-critical motion-reduce:transition-none",
          loaded ? "opacity-100" : "opacity-0",
        )}
      />
      ) : <div style={{ height }} />}
    </div>
  );
}

/**
 * The embedded side: reports the document's height to the host over mf-bridge, so the host frame fits the content
 * without scrollbars. Returns the bridge for the app's own messages.
 */
function useReportHeight(hostOrigins: string[], enabled = true) {
  const key = hostOrigins.join(" ");
  const [bridge, setBridge] = React.useState<Bridge<Record<string, MessageSpec>> | null>(null);
  React.useEffect(() => {
    if (!enabled || window.parent === window) return;
    const b = createBridge({ target: window.parent, origins: key.split(" "), messages: {} });
    setBridge(b as unknown as Bridge<Record<string, MessageSpec>>);
    const report = () => b.send(RESIZE, { height: document.documentElement.scrollHeight });
    void b.ready.then(report);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(report);
    observer?.observe(document.documentElement);
    return () => {
      observer?.disconnect();
      b.close();
    };
  }, [key, enabled]);
  return bridge;
}

export { MfFrame, useReportHeight };
