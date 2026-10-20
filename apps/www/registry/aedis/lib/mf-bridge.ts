import { hasSecretKey } from "./redact";

export const PROTOCOL = "aedis-mf";
export const VERSION = 1;

/**
 * Exact origins from configuration ("https://app.example.com"). Anything that is not a plain http(s) origin
 * ("*", "null", a path, a wildcard host, garbage) is dropped: a malformed entry never widens the list.
 */
export function allowedOrigins(list: readonly string[]): string[] {
  const out = new Set<string>();
  for (const entry of list) {
    const value = typeof entry === "string" ? entry.trim().replace(/\/$/, "") : "";
    if (!/^https?:\/\/[^*\s/]+$/i.test(value)) continue;
    try {
      const url = new URL(value);
      if (url.origin === value.toLowerCase() || url.origin === value) out.add(url.origin);
    } catch {
      // ignored
    }
  }
  return [...out];
}

/** How one message type is checked on arrival. */
export type MessageSpec<P = unknown> = {
  /** Must return true for the payload to be delivered. */
  validate: (payload: unknown) => payload is P;
  /** Overrides the bridge's size limit for this type. */
  maxBytes?: number;
  /** Allow keys that look like secrets (token, password…). Off: tokens should not travel between windows. */
  allowSecrets?: boolean;
};

type Specs = Record<string, MessageSpec>;
type PayloadOf<M extends Specs, T extends keyof M> = M[T] extends MessageSpec<infer P> ? P : never;

type Envelope = { protocol: typeof PROTOCOL; v: typeof VERSION; kind: "ready" | "ack" | "event" | "request" | "response" | "error"; type?: string; id?: string; payload?: unknown };

export type BridgeOptions<M extends Specs> = {
  /** The other window: the iframe's contentWindow on the host, window.parent in the embedded app. */
  target: Window | null | (() => Window | null);
  /** Origins the other side may have, from configuration. */
  origins: readonly string[];
  /** The message types this side accepts (allow-list), each with its validator. */
  messages: M;
  /** Largest message accepted, serialized. */
  maxBytes?: number;
  /** For requests and the handshake. */
  timeoutMs?: number;
  /** Called for every dropped message, e.g. to count them; never with the payload. */
  onDrop?: (reason: string) => void;
  /** The window that receives messages (tests); the current window by default. */
  self?: Window;
};

export type Bridge<M extends Specs> = {
  /** Resolves once the other side answered the handshake. */
  ready: Promise<void>;
  /** The other side's origin once the handshake is done. */
  peerOrigin: () => string | null;
  send: <T extends keyof M & string>(type: T, payload: PayloadOf<M, T>) => void;
  on: <T extends keyof M & string>(type: T, handler: (payload: PayloadOf<M, T>) => void) => () => void;
  /** Request/response with a correlation id; rejects after the timeout or when the other side fails. */
  request: <R = unknown>(type: string, payload?: unknown) => Promise<R>;
  /** Answers requests of this (accepted) type. */
  handle: <T extends keyof M & string>(type: T, handler: (payload: PayloadOf<M, T>) => unknown) => () => void;
  close: () => void;
};

const size = (value: unknown) => {
  try {
    return new TextEncoder().encode(JSON.stringify(value)).length;
  } catch {
    return Infinity;
  }
};

const id = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

/**
 * A typed, origin-checked postMessage channel between two windows. Every message must come from the target window
 * and an allowed origin, carry this protocol, be of an accepted type, fit the size limit and pass its validator;
 * anything else is dropped. Messages go out with an explicit targetOrigin, never "*".
 */
export function createBridge<M extends Specs>({ target, origins, messages, maxBytes = 64 * 1024, timeoutMs = 5000, onDrop, self = window }: BridgeOptions<M>): Bridge<M> {
  const allowed = allowedOrigins(origins);
  const peer = () => (typeof target === "function" ? target() : target);
  let peerOrigin: string | null = null;
  const listeners = new Map<string, Set<(p: unknown) => void>>();
  const handlers = new Map<string, (p: unknown) => unknown>();
  const pending = new Map<string, { resolve: (v: unknown) => void; reject: (e: Error) => void; timer: ReturnType<typeof setTimeout> }>();
  let markReady!: () => void;
  const ready = new Promise<void>((resolve) => (markReady = resolve));

  const post = (envelope: Omit<Envelope, "protocol" | "v">, to?: string) => {
    const win = peer();
    if (!win) return;
    const message = { protocol: PROTOCOL, v: VERSION, ...envelope };
    // Before the handshake the peer's origin is unknown: try each allowed one; the browser delivers to the match only.
    for (const origin of to ? [to] : peerOrigin ? [peerOrigin] : allowed) win.postMessage(message, origin);
  };

  const drop = (reason: string) => onDrop?.(reason);

  const accept = (type: string | undefined, payload: unknown): type is string => {
    const spec = type === undefined ? undefined : messages[type];
    if (!spec) return drop("type not accepted"), false;
    if (size(payload) > (spec.maxBytes ?? maxBytes)) return drop("too large"), false;
    if (!spec.allowSecrets && hasSecretKey(payload)) return drop("secret in payload"), false;
    if (!spec.validate(payload)) return drop("invalid payload"), false;
    return true;
  };

  const onMessage = (event: MessageEvent) => {
    const win = peer();
    if (!win || event.source !== win) return drop("wrong window");
    if (!allowed.includes(event.origin)) return drop("origin not allowed");
    if (peerOrigin && event.origin !== peerOrigin) return drop("origin changed");
    const data = event.data as Partial<Envelope> | null;
    if (!data || typeof data !== "object" || data.protocol !== PROTOCOL || data.v !== VERSION) return drop("not this protocol");
    if (size(data) > maxBytes * 2) return drop("too large");

    switch (data.kind) {
      case "ready":
        peerOrigin = event.origin;
        post({ kind: "ack" }, event.origin);
        return markReady();
      case "ack":
        peerOrigin = event.origin;
        return markReady();
      case "event":
        if (!accept(data.type, data.payload)) return;
        return listeners.get(data.type)?.forEach((fn) => fn(data.payload));
      case "request": {
        if (typeof data.id !== "string" || data.id.length > 64) return drop("bad id");
        const requestId = data.id;
        const handler = data.type === undefined ? undefined : handlers.get(data.type);
        if (!handler || !accept(data.type, data.payload)) return post({ kind: "error", id: requestId, type: data.type }, event.origin);
        Promise.resolve()
          .then(() => handler(data.payload))
          .then(
            (payload) =>
              size(payload) > maxBytes || hasSecretKey(payload)
                ? post({ kind: "error", id: requestId, type: data.type }, event.origin)
                : post({ kind: "response", id: requestId, type: data.type, payload }, event.origin),
            // The other side learns that it failed, never why.
            () => post({ kind: "error", id: requestId, type: data.type }, event.origin),
          );
        return;
      }
      case "response":
      case "error": {
        const call = typeof data.id === "string" ? pending.get(data.id) : undefined;
        if (!call) return drop("unknown response");
        pending.delete(data.id!);
        clearTimeout(call.timer);
        if (data.kind === "error") return call.reject(new Error("bridge: request failed"));
        if (size(data.payload) > maxBytes) return call.reject(new Error("bridge: response too large"));
        return call.resolve(data.payload);
      }
      default:
        return drop("unknown kind");
    }
  };

  self.addEventListener("message", onMessage);
  post({ kind: "ready" });

  const guard = (payload: unknown, type: string) => {
    if (size(payload) > maxBytes) throw new Error(`bridge: "${type}" payload is too large`);
    if (hasSecretKey(payload)) throw new Error(`bridge: "${type}" payload looks like it carries a secret; keep tokens out of postMessage`);
  };

  return {
    ready,
    peerOrigin: () => peerOrigin,
    send(type, payload) {
      guard(payload, type);
      post({ kind: "event", type, payload });
    },
    on(type, handler) {
      const set = listeners.get(type) ?? new Set();
      set.add(handler as (p: unknown) => void);
      listeners.set(type, set);
      return () => set.delete(handler as (p: unknown) => void);
    },
    request(type, payload) {
      guard(payload, type);
      const requestId = id();
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pending.delete(requestId);
          reject(new Error(`bridge: "${type}" timed out`));
        }, timeoutMs);
        pending.set(requestId, { resolve: resolve as (v: unknown) => void, reject, timer });
        post({ kind: "request", id: requestId, type, payload });
      });
    },
    handle(type, handler) {
      handlers.set(type, handler as (p: unknown) => unknown);
      return () => handlers.delete(type);
    },
    close() {
      self.removeEventListener("message", onMessage);
      for (const [key, call] of pending) {
        clearTimeout(call.timer);
        call.reject(new Error("bridge: closed"));
        pending.delete(key);
      }
    },
  };
}
