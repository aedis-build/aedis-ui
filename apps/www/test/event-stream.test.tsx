import { act, render, screen, waitFor } from "@testing-library/react";
import fc from "fast-check";

import { hasInvisible } from "@/lib/untrusted";
import { useEventStream } from "@/registry/aedis/hooks/use-event-stream";
import { assertStreamPath, connectEventStream, createSseParser, MAX_EVENT_ID, type SseEvent } from "@/registry/aedis/lib/event-stream";

const collect = (chunks: string[], maxEventBytes?: number) => {
  const out: SseEvent[] = [];
  const retries: number[] = [];
  const p = createSseParser({ maxEventBytes, onEvent: (e) => out.push(e), onRetry: (ms) => retries.push(ms) });
  for (const c of chunks) p.push(c);
  p.end();
  return { events: out, retries };
};

/** Splits text at arbitrary positions. */
const chunked = (text: string, cuts: number[]) => {
  const at = [...new Set(cuts.map((c) => c % (text.length + 1)))].sort((a, b) => a - b);
  const parts: string[] = [];
  let prev = 0;
  for (const c of at) {
    parts.push(text.slice(prev, c));
    prev = c;
  }
  parts.push(text.slice(prev));
  return parts;
};

describe("createSseParser", () => {
  it("reads the event stream format", () => {
    const { events, retries } = collect([": heartbeat\n", "event: token\nid: 7\ndata: {\"a\":\ndata:1}\n\n", "data: plain\r\n\r\n", "retry: 2500\n", "data: no final blank line"]);
    expect(events).toEqual([
      { type: "token", data: '{"a":\n1}', id: "7" },
      { type: "message", data: "plain", id: "7" },
    ]);
    expect(retries).toEqual([2500]);
  });

  it("ignores ids that are too long or not printable, and bad retry values", () => {
    const { events, retries } = collect([`id: ${"x".repeat(MAX_EVENT_ID + 1)}\ndata: a\n\nid: a\u0001b\ndata: b\n\nretry: soon\nretry: -1\n`]);
    expect(events.map((e) => e.id)).toEqual(["", ""]);
    expect(retries).toEqual([]);
  });

  it("gives the same events however the text is chunked (property)", () => {
    const event = fc.record({
      type: fc.option(fc.constantFrom("message", "token", "done"), { nil: undefined }),
      id: fc.option(fc.stringMatching(/^[a-z0-9-]{1,12}$/), { nil: undefined }),
      lines: fc.array(fc.string({ unit: "grapheme" }).filter((s) => !/[\r\n]/.test(s)), { minLength: 1, maxLength: 3 }),
    });
    fc.assert(
      fc.property(fc.array(event, { maxLength: 6 }), fc.constantFrom("\n", "\r\n", "\r"), fc.array(fc.nat(), { maxLength: 12 }), (evts, eol, cuts) => {
        const text = evts
          .map((e) => [e.type ? `event: ${e.type}` : null, e.id ? `id: ${e.id}` : null, ...e.lines.map((l) => `data: ${l}`)].filter(Boolean).join(eol) + eol + eol)
          .join("");
        expect(collect(chunked(text, cuts)).events).toEqual(collect([text]).events);
      }),
    );
  });

  it("drops events past the size limit, including a line that never ends (property)", () => {
    fc.assert(
      fc.property(fc.integer({ min: 65, max: 400 }), fc.array(fc.nat(), { maxLength: 8 }), (huge, cuts) => {
        const text = `data: ${"x".repeat(huge)}\n\ndata: ${"y".repeat(huge)}${"z".repeat(huge)}\ndata: still the same event\n\ndata: ok\n\n`;
        const { events } = collect(chunked(text, cuts), 64);
        expect(events).toEqual([{ type: "message", data: "ok", id: "" }]);
      }),
    );
  });

  it("strips hidden code points from the assembled event even when a byte chunk splits a surrogate pair (property)", () => {
    const tag = fc.integer({ min: 0xe0000, max: 0xe007f }).map((c) => String.fromCodePoint(c));
    const zw = fc.constantFrom("​", "‮", "⁦", "﻿");
    const piece = fc.oneof(fc.string({ unit: "grapheme", maxLength: 3 }), tag, zw);
    fc.assert(
      fc.property(fc.array(piece, { maxLength: 20 }), fc.array(fc.nat(), { maxLength: 10 }), (pieces, cuts) => {
        const payload = pieces.join("").replace(/[\r\n]/g, "");
        const bytes = new TextEncoder().encode(`data: ${payload}\n\n`);
        const at = [...new Set(cuts.map((c) => c % (bytes.length + 1)))].sort((a, b) => a - b);
        const decoder = new TextDecoder("utf-8");
        const out: SseEvent[] = [];
        const p = createSseParser({ onEvent: (e) => out.push(e) });
        let prev = 0;
        for (const c of [...at, bytes.length]) {
          p.push(decoder.decode(bytes.slice(prev, c), { stream: true }));
          prev = c;
        }
        p.push(decoder.decode());
        if (payload.length === 0) return;
        expect(out).toHaveLength(1);
        expect(hasInvisible(out[0].data)).toBe(false);
      }),
    );
  });
});

describe("assertStreamPath", () => {
  it("accepts same-origin paths and refuses other hosts and tokens in the query", () => {
    expect(() => assertStreamPath("/api/events?since=3")).not.toThrow();
    for (const bad of ["https://evil.example/events", "//evil.example/events", "/\\evil", "api/events"]) expect(() => assertStreamPath(bad)).toThrow(/relative/);
    for (const bad of ["/events?token=abc", "/events?a=1&access_token=x", "/events?JWT=x", "/events?api-key=x"]) expect(() => assertStreamPath(bad)).toThrow(/token/);
  });
});

/** A fetch that answers each call with the next scripted response. */
function scriptedFetch(responses: (() => Response | Promise<Response>)[]) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fn = vi.fn(async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const next = responses.shift();
    if (!next) return new Promise<Response>((_, reject) => init.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError"))));
    return next();
  });
  vi.stubGlobal("fetch", fn);
  return calls;
}

function sse(chunks: string[], { status = 200, type = "text/event-stream", hold = false } = {}) {
  return () =>
    new Response(
      new ReadableStream<Uint8Array>({
        start(controller) {
          for (const c of chunks) controller.enqueue(new TextEncoder().encode(c));
          if (!hold) controller.close();
        },
      }),
      { status, headers: { "content-type": type } },
    );
}

const until = (fn: () => boolean) => vi.waitFor(() => expect(fn()).toBe(true), { timeout: 3000 });

describe("connectEventStream", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("sends the api() rules, filters event types and ignores malformed JSON", async () => {
    const calls = scriptedFetch([sse(['data: {"n":1}\n\n', "event: other\ndata: {\"n\":2}\n\n", "data: not json\n\n", 'event: token\ndata: {"n":3}\n\n'], { hold: true })]);
    const got: unknown[] = [];
    const states: string[] = [];
    const { close } = connectEventStream<{ n: number }>("/api/events", { events: ["message", "token"], onEvent: (d) => got.push(d.n), onState: (s) => states.push(s), lastEventId: "41" });
    await until(() => got.length === 2);
    expect(got).toEqual([1, 3]);
    const { init } = calls[0];
    expect(init).toMatchObject({ method: "GET", credentials: "same-origin", redirect: "error", cache: "no-store" });
    expect(init.headers).toMatchObject({ Accept: "text/event-stream", "X-Requested-With": "XMLHttpRequest", "Last-Event-ID": "41" });
    close();
    await until(() => states.at(-1) === "closed");
    expect(states.slice(0, 2)).toEqual(["connecting", "open"]);
  });

  it("reconnects after the normal end and resumes from the last event id", async () => {
    const calls = scriptedFetch([sse(["id: 5\ndata: {}\n\n"]), sse(["retry: 10\n"], { hold: true })]);
    const { close } = connectEventStream("/api/events", { onEvent: () => {}, retryMs: 5 });
    await until(() => calls.length === 2);
    expect((calls[1].init.headers as Record<string, string>)["Last-Event-ID"]).toBe("5");
    close();
  });

  it("stops on 204 and on client errors, retries server errors and gives up after maxRetries", async () => {
    const states: string[] = [];
    scriptedFetch([() => new Response(null, { status: 204 })]);
    connectEventStream("/a", { onEvent: () => {}, onState: (s) => states.push(s) });
    await until(() => states.includes("closed"));

    const fatal: string[] = [];
    scriptedFetch([() => new Response("no", { status: 401 })]);
    connectEventStream("/a", { onEvent: () => {}, onState: (s) => fatal.push(s) });
    await until(() => fatal.includes("error"));

    const wrongType: string[] = [];
    scriptedFetch([sse(["data: {}\n\n"], { type: "text/html" })]);
    connectEventStream("/a", { onEvent: () => {}, onState: (s) => wrongType.push(s) });
    await until(() => wrongType.includes("error"));

    const flaky: string[] = [];
    const calls = scriptedFetch([() => new Response("", { status: 503 }), () => Promise.reject(new TypeError("network")), () => new Response("", { status: 500 })]);
    connectEventStream("/a", { onEvent: () => {}, onState: (s) => flaky.push(s), maxRetries: 2, retryMs: 1 });
    await until(() => flaky.includes("error"));
    expect(calls).toHaveLength(3);
    expect(flaky).toContain("retrying");
  });

  it("reconnects when the heartbeat stops and after too many bytes", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const calls = scriptedFetch([sse(["data: {}\n\n"], { hold: true }), sse([`data: ${"x".repeat(200)}\n\n`], { hold: true }), sse([], { hold: true })]);
    const { close } = connectEventStream("/a", { onEvent: () => {}, heartbeatMs: 1000, retryMs: 1, maxConnectionBytes: 100 });
    await until(() => calls.length === 1);
    await vi.advanceTimersByTimeAsync(2100);
    await until(() => calls.length >= 3);
    close();
  });

  it("does not resume from an id it would not send", async () => {
    const calls = scriptedFetch([sse([], { hold: true })]);
    const { close } = connectEventStream("/a", { onEvent: () => {}, lastEventId: "x\ny" });
    await until(() => calls.length === 1);
    expect(calls[0].init.headers).not.toHaveProperty("Last-Event-ID");
    close();
  });

  it("closes when the caller's signal aborts", async () => {
    scriptedFetch([sse([], { hold: true })]);
    const states: string[] = [];
    const ctrl = new AbortController();
    connectEventStream("/a", { onEvent: () => {}, onState: (s) => states.push(s), signal: ctrl.signal });
    await until(() => states.includes("open"));
    ctrl.abort();
    await until(() => states.at(-1) === "closed");
  });
});

describe("useEventStream", () => {
  afterEach(() => vi.unstubAllGlobals());

  function Probe({ path, onEvent, enabled }: { path: string | null; onEvent: (d: unknown) => void; enabled?: boolean }) {
    const state = useEventStream(path, { onEvent, enabled });
    return <span>{state}</span>;
  }

  it("streams events, reports its state and aborts on unmount", async () => {
    const calls = scriptedFetch([sse(['data: {"id":1}\n\ndata: oops\n\n'], { hold: true })]);
    const onEvent = vi.fn();
    const { unmount } = render(<Probe path="/events" onEvent={onEvent} />);
    await waitFor(() => expect(onEvent).toHaveBeenCalledExactlyOnceWith({ id: 1 }, { type: "message", id: "" }));
    expect(screen.getByText("open")).toBeInTheDocument();
    unmount();
    expect((calls[0].init.signal as AbortSignal).aborted).toBe(true);
  });

  it("does nothing without a path or while disabled", () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    render(
      <>
        <Probe path={null} onEvent={() => {}} />
        <Probe path="/events" enabled={false} onEvent={() => {}} />
      </>,
    );
    expect(fetch).not.toHaveBeenCalled();
    expect(screen.getAllByText("closed")).toHaveLength(2);
    act(() => {});
  });
});
