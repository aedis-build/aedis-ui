import fc from "fast-check";

import { allowedOrigins, createBridge, PROTOCOL, VERSION, type MessageSpec } from "@/registry/aedis/lib/mf-bridge";

const CHILD = "https://agent.example.com";
const isResize = (p: unknown): p is { height: number } => typeof p === "object" && p !== null && typeof (p as { height?: unknown }).height === "number";
const isText = (p: unknown): p is string => typeof p === "string";
const messages = { resize: { validate: isResize } as MessageSpec<{ height: number }>, ping: { validate: isText } as MessageSpec<string> };

function frame() {
  const el = document.createElement("iframe");
  document.body.appendChild(el);
  return el.contentWindow!;
}

const envelope = (kind: string, extra: Record<string, unknown> = {}) => ({ protocol: PROTOCOL, v: VERSION, kind, ...extra });
const deliver = (data: unknown, origin: string, source: Window) => window.dispatchEvent(new MessageEvent("message", { data, origin, source }));

afterEach(() => {
  document.body.innerHTML = "";
  vi.useRealTimers();
});

describe("allowedOrigins", () => {
  it("keeps plain origins and drops wildcards, nulls, paths and garbage", () => {
    expect(allowedOrigins([CHILD, "https://agent.example.com/", "*", "null", "https://*.example.com", "https://a.com/path", "javascript:alert(1)", "", "ftp://x.com", " http://localhost:3000 "])).toEqual([
      CHILD,
      "http://localhost:3000",
    ]);
  });

  it("never returns a wildcard or anything that is not an origin (property)", () => {
    fc.assert(
      fc.property(fc.array(fc.oneof(fc.webUrl(), fc.string(), fc.constant("*"), fc.constant("https://*.a.com"))), (list) => {
        for (const o of allowedOrigins(list)) {
          expect(o).not.toContain("*");
          expect(new URL(o).origin).toBe(o);
        }
      }),
    );
  });
});

describe("createBridge", () => {
  it("handshakes with an explicit targetOrigin, never *", async () => {
    const child = frame();
    const post = vi.spyOn(child, "postMessage").mockImplementation(() => {});
    const bridge = createBridge({ target: child, origins: [CHILD, "https://backup.example.com", "*"], messages });
    expect(post.mock.calls.map((c) => c[1])).toEqual([CHILD, "https://backup.example.com"]);
    deliver(envelope("ack"), CHILD, child);
    await bridge.ready;
    expect(bridge.peerOrigin()).toBe(CHILD);
    bridge.send("ping", "hello");
    expect(post.mock.calls.at(-1)).toEqual([envelope("event", { type: "ping", payload: "hello" }), CHILD]);
    expect(post.mock.calls.every((c) => String(c[1]) !== "*")).toBe(true);
    bridge.close();
  });

  it("answers the other side's ready with an ack", async () => {
    const child = frame();
    const post = vi.spyOn(child, "postMessage").mockImplementation(() => {});
    const bridge = createBridge({ target: () => child, origins: [CHILD], messages });
    deliver(envelope("ready"), CHILD, child);
    await bridge.ready;
    expect(post.mock.calls.at(-1)).toEqual([envelope("ack"), CHILD]);
    bridge.close();
  });

  it("delivers valid messages and drops everything else", async () => {
    const child = frame();
    const other = frame();
    vi.spyOn(child, "postMessage").mockImplementation(() => {});
    const drops: string[] = [];
    const bridge = createBridge({ target: child, origins: [CHILD], messages, onDrop: (r) => drops.push(r), maxBytes: 200 });
    const got = vi.fn();
    bridge.on("resize", got);
    deliver(envelope("ack"), CHILD, child);
    await bridge.ready;

    deliver(envelope("event", { type: "resize", payload: { height: 320 } }), CHILD, child);
    deliver(envelope("event", { type: "resize", payload: { height: 1 } }), "https://evil.example", child);
    deliver(envelope("event", { type: "resize", payload: { height: 2 } }), CHILD, other);
    deliver(envelope("event", { type: "eval", payload: "x" }), CHILD, child);
    deliver(envelope("event", { type: "resize", payload: { height: "tall" } }), CHILD, child);
    deliver(envelope("event", { type: "resize", payload: { height: 3, token: "abc" } }), CHILD, child);
    deliver(envelope("event", { type: "ping", payload: "x".repeat(500) }), CHILD, child);
    deliver({ ...envelope("event", { type: "resize", payload: { height: 4 } }), v: 2 }, CHILD, child);
    deliver("plain string", CHILD, child);
    deliver(envelope("teleport"), CHILD, child);

    expect(got.mock.calls).toEqual([[{ height: 320 }]]);
    expect(drops).toEqual(["origin not allowed", "wrong window", "type not accepted", "invalid payload", "secret in payload", "too large", "not this protocol", "not this protocol", "unknown kind"]);
    bridge.close();
  });

  it("always drops messages from other origins or other windows (property)", async () => {
    const child = frame();
    const other = frame();
    vi.spyOn(child, "postMessage").mockImplementation(() => {});
    const bridge = createBridge({ target: child, origins: [CHILD], messages });
    const got = vi.fn();
    bridge.on("ping", got);
    fc.assert(
      fc.property(fc.oneof(fc.webUrl().map((u) => new URL(u).origin), fc.constant("null"), fc.constant(`${CHILD}.evil.com`)), fc.boolean(), (origin, fromOther) => {
        fc.pre(origin !== CHILD || fromOther);
        deliver(envelope("event", { type: "ping", payload: "x" }), origin, fromOther ? other : child);
      }),
    );
    expect(got).not.toHaveBeenCalled();
    bridge.close();
  });

  it("refuses to send secrets or oversized payloads", () => {
    const child = frame();
    vi.spyOn(child, "postMessage").mockImplementation(() => {});
    const bridge = createBridge({ target: child, origins: [CHILD], messages, maxBytes: 50 });
    expect(() => bridge.send("resize", { height: 1, accessToken: "x" } as never)).toThrow(/secret/);
    expect(() => bridge.send("ping", "x".repeat(100))).toThrow(/too large/);
    bridge.close();
  });

  it("matches requests and responses by id, times out, and never says why the other side failed", async () => {
    vi.useFakeTimers();
    const child = frame();
    const post = vi.spyOn(child, "postMessage").mockImplementation(() => {});
    const bridge = createBridge({ target: child, origins: [CHILD], messages, timeoutMs: 1000 });
    deliver(envelope("ack"), CHILD, child);
    await bridge.ready;

    const answered = bridge.request<number>("measure", { what: "height" });
    const sent = post.mock.calls.at(-1)![0] as { id: string };
    deliver(envelope("response", { id: "someone-else", payload: 1 }), CHILD, child);
    deliver(envelope("response", { id: sent.id, payload: 480 }), CHILD, child);
    await expect(answered).resolves.toBe(480);

    const failed = bridge.request("measure");
    deliver(envelope("error", { id: (post.mock.calls.at(-1)![0] as { id: string }).id }), CHILD, child);
    await expect(failed).rejects.toThrow("bridge: request failed");

    const slow = bridge.request("measure");
    vi.advanceTimersByTime(1001);
    await expect(slow).rejects.toThrow(/timed out/);

    const open = bridge.request("measure");
    bridge.close();
    await expect(open).rejects.toThrow(/closed/);
  });

  it("answers requests of accepted types, and errors for unknown types, bad payloads, throws and secrets", async () => {
    const child = frame();
    const post = vi.spyOn(child, "postMessage").mockImplementation(() => {});
    const bridge = createBridge({ target: child, origins: [CHILD], messages });
    bridge.handle("ping", (text) => `pong:${text}`);
    const stopResize = bridge.handle("resize", () => ({ sessionToken: "leak" }));
    deliver(envelope("ack"), CHILD, child);
    await bridge.ready;

    const last = () => post.mock.calls.at(-1)!;
    deliver(envelope("request", { id: "1", type: "ping", payload: "hi" }), CHILD, child);
    await vi.waitFor(() => expect(last()).toEqual([envelope("response", { id: "1", type: "ping", payload: "pong:hi" }), CHILD]));
    deliver(envelope("request", { id: "2", type: "ping", payload: 42 }), CHILD, child);
    expect(last()).toEqual([envelope("error", { id: "2", type: "ping" }), CHILD]);
    deliver(envelope("request", { id: "3", type: "resize", payload: { height: 1 } }), CHILD, child);
    await vi.waitFor(() => expect(last()).toEqual([envelope("error", { id: "3", type: "resize" }), CHILD]));
    stopResize();
    deliver(envelope("request", { id: "4", type: "resize", payload: { height: 1 } }), CHILD, child);
    expect(last()).toEqual([envelope("error", { id: "4", type: "resize" }), CHILD]);
    bridge.handle("ping", () => {
      throw new Error("database password is hunter2");
    });
    deliver(envelope("request", { id: "5", type: "ping", payload: "x" }), CHILD, child);
    await vi.waitFor(() => expect(last()).toEqual([envelope("error", { id: "5", type: "ping" }), CHILD]));
    deliver(envelope("request", { id: "x".repeat(100), type: "ping", payload: "x" }), CHILD, child);
    expect(last()[0]).not.toMatchObject({ id: "x".repeat(100) });
    bridge.close();
  });

  it("ignores a peer whose origin changes after the handshake, and does nothing without a target", async () => {
    const child = frame();
    vi.spyOn(child, "postMessage").mockImplementation(() => {});
    const drops: string[] = [];
    const bridge = createBridge({ target: child, origins: [CHILD, "https://other.example.com"], messages, onDrop: (r) => drops.push(r) });
    deliver(envelope("ack"), CHILD, child);
    await bridge.ready;
    deliver(envelope("event", { type: "ping", payload: "x" }), "https://other.example.com", child);
    expect(drops).toContain("origin changed");
    bridge.close();
    const lonely = createBridge({ target: null, origins: [CHILD], messages });
    expect(() => lonely.send("ping", "x")).not.toThrow();
    lonely.close();
  });
});
