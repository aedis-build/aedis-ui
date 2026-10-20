// @vitest-environment node
import { bffStream } from "@/registry/aedis/lib/bff-stream";

const UPSTREAM = "https://api.internal/conversations/42/events";

function upstreamStream(chunks: string[], { hold = false } = {}) {
  let cancelled = false;
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const c of chunks) controller.enqueue(new TextEncoder().encode(c));
      if (!hold) controller.close();
    },
    cancel() {
      cancelled = true;
    },
  });
  return { response: new Response(body, { headers: { "content-type": "text/event-stream", "set-cookie": "api=1", "x-internal": "secret" } }), cancelled: () => cancelled };
}

function stubFetch(answer: (url: URL, init: RequestInit) => Response | Promise<Response>) {
  const calls: { url: URL; init: RequestInit }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: URL, init: RequestInit) => {
      calls.push({ url, init });
      return answer(url, init);
    }),
  );
  return calls;
}

const browserRequest = (headers: Record<string, string> = {}, init: RequestInit = {}) =>
  new Request("https://app.example/api/events?upstream=https://evil.example", {
    headers: { cookie: "session=browser-cookie", authorization: "Bearer from-browser", "last-event-id": "17", ...headers },
    ...init,
  });

afterEach(() => vi.unstubAllGlobals());

describe("bffStream", () => {
  it("relays the stream with the session bearer and nothing from the browser but a valid Last-Event-ID", async () => {
    const { response } = upstreamStream(["id: 18\ndata: {}\n\n"]);
    const calls = stubFetch(() => response);
    const log = vi.fn();
    const handler = bffStream({ upstream: UPSTREAM, getAccessToken: () => "server-token", headers: { "X-Tenant": "acme" }, log });

    const res = await handler(browserRequest());
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("id: 18\ndata: {}\n\n");
    expect(String(calls[0].url)).toBe(UPSTREAM);
    expect(calls[0].init).toMatchObject({ method: "GET", redirect: "error", cache: "no-store" });
    expect(calls[0].init.headers).toEqual({ "X-Tenant": "acme", Accept: "text/event-stream", Authorization: "Bearer server-token", "Last-Event-ID": "17" });
    expect(res.headers.get("content-type")).toBe("text/event-stream; charset=utf-8");
    expect(res.headers.get("cache-control")).toBe("no-store, no-transform");
    expect(res.headers.get("x-accel-buffering")).toBe("no");
    expect(res.headers.get("set-cookie")).toBeNull();
    expect(res.headers.get("x-internal")).toBeNull();
    expect(res.headers.get("content-encoding")).toBeNull();
    expect(log).not.toHaveBeenCalled();
  });

  it("drops a Last-Event-ID that is too long or not printable", async () => {
    for (const id of ["x".repeat(257), "a\u0007b"]) {
      const calls = stubFetch(() => upstreamStream([]).response);
      await bffStream({ upstream: UPSTREAM, getAccessToken: () => "t" })(browserRequest({ "last-event-id": id }));
      expect(calls[0].init.headers).not.toHaveProperty("Last-Event-ID");
    }
  });

  it("answers 401 without calling the API when there is no session", async () => {
    const calls = stubFetch(() => upstreamStream([]).response);
    const res = await bffStream({ upstream: UPSTREAM, getAccessToken: async () => null })(browserRequest());
    expect(res.status).toBe(401);
    expect(calls).toHaveLength(0);
  });

  it("refuses other methods and configured credential or hop-by-hop headers", async () => {
    expect((await bffStream({ upstream: UPSTREAM, getAccessToken: () => "t" })(browserRequest({}, { method: "POST" }))).status).toBe(405);
    for (const name of ["Authorization", "cookie", "Connection", "Transfer-Encoding", "Host"]) {
      expect(() => bffStream({ upstream: UPSTREAM, getAccessToken: () => "t", headers: { [name]: "x" } })).toThrow(/cannot be configured/);
    }
  });

  it("gives the browser a generic status and logs the details", async () => {
    const log = vi.fn();
    const cases: [Response | Error, number][] = [
      [new Response("stack trace with secrets", { status: 500 }), 502],
      [new Response("expired", { status: 401 }), 401],
      [new Response("nope", { status: 403 }), 403],
      [new Response("<html>", { status: 200, headers: { "content-type": "text/html" } }), 502],
      [new Response(null, { status: 204 }), 204],
      [new TypeError("connect ECONNREFUSED 10.0.0.3"), 502],
    ];
    for (const [answer, status] of cases) {
      stubFetch(() => (answer instanceof Error ? Promise.reject(answer) : answer));
      const res = await bffStream({ upstream: UPSTREAM, getAccessToken: () => "t", log })(browserRequest());
      expect(res.status).toBe(status);
      expect(await res.text()).toBe("");
    }
    expect(log).toHaveBeenCalledTimes(5);
    expect(JSON.stringify(log.mock.calls)).toContain("status");
  });

  it("refuses an upstream that is not http(s) and a failing session lookup, without leaking why", async () => {
    const log = vi.fn();
    stubFetch(() => upstreamStream([]).response);
    expect((await bffStream({ upstream: "file:///etc/passwd", getAccessToken: () => "t", log })(browserRequest())).status).toBe(500);
    expect((await bffStream({ upstream: UPSTREAM, getAccessToken: () => Promise.reject(new Error("db down")), log })(browserRequest())).status).toBe(500);
    expect(log).toHaveBeenCalledTimes(2);
  });

  it("takes the upstream from configuration, which may depend on the request but is never read from it", async () => {
    const calls = stubFetch(() => upstreamStream([]).response);
    const handler = bffStream({ upstream: (req) => `${UPSTREAM}?lang=${new URL(req.url).searchParams.get("lang") === "pt" ? "pt" : "en"}`, getAccessToken: () => "t" });
    await handler(new Request("https://app.example/api/events?lang=pt"));
    expect(String(calls[0].url)).toBe(`${UPSTREAM}?lang=pt`);
  });

  it("aborts the API request when the browser disconnects", async () => {
    const upstream = upstreamStream(["data: {}\n\n"], { hold: true });
    const calls = stubFetch(() => upstream.response);
    const browser = new AbortController();
    const res = await bffStream({ upstream: UPSTREAM, getAccessToken: () => "t" })(browserRequest({}, { signal: browser.signal }));
    const reader = res.body!.getReader();
    await reader.read();
    browser.abort();
    await vi.waitFor(() => expect(upstream.cancelled()).toBe(true));
    expect((calls[0].init.signal as AbortSignal).aborted).toBe(true);
  });

  it("aborts when the API does not start the stream in time", async () => {
    vi.useFakeTimers();
    stubFetch((_url, init) => new Promise((_, reject) => init.signal!.addEventListener("abort", () => reject(new DOMException("timeout", "AbortError")))));
    const pending = bffStream({ upstream: UPSTREAM, getAccessToken: () => "t", connectTimeoutMs: 1000, log: () => {} })(browserRequest());
    await vi.advanceTimersByTimeAsync(1001);
    expect((await pending).status).toBe(502);
    vi.useRealTimers();
  });
});
