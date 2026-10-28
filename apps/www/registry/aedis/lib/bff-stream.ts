import "server-only";

export type BffStreamOptions = {
  /** The API's stream URL, from configuration (e.g. an environment variable), never from the request. */
  upstream: string | URL | ((request: Request) => string | URL);
  /** The bearer of the server-side session, or null when signed out. It never reaches the browser. */
  getAccessToken: (request: Request) => Promise<string | null> | string | null;
  /** Extra headers for the API (e.g. a tenant id). Credentials, cookies and hop-by-hop headers are refused. */
  headers?: Record<string, string>;
  /** Where failure details go: the server log, never the browser. */
  log?: (message: string, details?: unknown) => void;
  /** Time to wait for the API to start the stream. */
  connectTimeoutMs?: number;
  /** The fetch used for the upstream request; the global one by default (tests and demos pass their own). */
  fetcher?: typeof fetch;
};

const MAX_EVENT_ID = 256;
const PRINTABLE = /^[\x20-\x7E]*$/;
// Never sent upstream from configuration either: credentials come only from getAccessToken, the rest is per hop.
const REFUSED = new Set(["authorization", "cookie", "set-cookie", "connection", "keep-alive", "proxy-authorization", "proxy-authenticate", "te", "trailer", "transfer-encoding", "upgrade", "host", "content-length"]);

const STREAM_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  // no-transform keeps proxies from compressing or buffering the stream.
  "Cache-Control": "no-store, no-transform",
  "X-Accel-Buffering": "no",
};

const plain = (status: number) => new Response(null, { status, headers: { "Cache-Control": "no-store" } });

function upstreamUrl(value: BffStreamOptions["upstream"], request: Request) {
  const url = new URL(typeof value === "function" ? value(request) : value);
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error(`bffStream: upstream must be http(s), got ${url.protocol}`);
  return url;
}

/**
 * A Next.js route handler that relays a Server-Sent Events stream from the API with the session's bearer, so the
 * token stays on the server. Nothing from the browser travels upstream except a validated Last-Event-ID; the
 * browser's cookies stay here. Errors are generic for the browser and detailed in the log.
 *
 *   export const GET = bffStream({ upstream: process.env.EVENTS_URL!, getAccessToken: (req) => session(req).token });
 */
export function bffStream({ upstream, getAccessToken, headers = {}, log = console.error, connectTimeoutMs = 15_000, fetcher = (...args) => fetch(...args) }: BffStreamOptions) {
  for (const name of Object.keys(headers)) {
    if (REFUSED.has(name.toLowerCase())) throw new Error(`bffStream: header "${name}" cannot be configured`);
  }

  return async function GET(request: Request): Promise<Response> {
    if (request.method !== "GET") return plain(405);
    let token: string | null;
    let url: URL;
    try {
      url = upstreamUrl(upstream, request);
      token = await getAccessToken(request);
    } catch (error) {
      log("bffStream: could not prepare the upstream request", error);
      return plain(500);
    }
    if (!token) return plain(401);

    const lastEventId = request.headers.get("last-event-id");
    const resume = lastEventId && lastEventId.length <= MAX_EVENT_ID && PRINTABLE.test(lastEventId) ? lastEventId : null;

    // Ends the API request when the browser goes away, and bounds the wait for the first byte.
    const abort = new AbortController();
    const onDisconnect = () => abort.abort();
    request.signal.addEventListener("abort", onDisconnect, { once: true });
    const timer = setTimeout(() => abort.abort(), connectTimeoutMs);

    let response: Response;
    try {
      response = await fetcher(url, {
        method: "GET",
        redirect: "error",
        cache: "no-store",
        signal: abort.signal,
        headers: {
          ...headers,
          Accept: "text/event-stream",
          Authorization: `Bearer ${token}`,
          ...(resume ? { "Last-Event-ID": resume } : {}),
        },
      });
    } catch (error) {
      request.signal.removeEventListener("abort", onDisconnect);
      if (!request.signal.aborted) log("bffStream: upstream request failed", error);
      return plain(502);
    } finally {
      clearTimeout(timer);
    }

    if (response.status === 204 || !response.ok || !response.body) request.signal.removeEventListener("abort", onDisconnect);
    if (response.status === 204) return plain(204);
    if (!response.ok || !/^text\/event-stream\b/i.test(response.headers.get("content-type") ?? "") || !response.body) {
      log("bffStream: upstream refused the stream", { status: response.status, type: response.headers.get("content-type") });
      void response.body?.cancel().catch(() => {});
      // The client stops on 401/403 and retries on 502; the API's own body never reaches the browser.
      return plain(response.status === 401 || response.status === 403 ? response.status : 502);
    }

    const body = response.body;
    const relay = new ReadableStream<Uint8Array>({
      async start(controller) {
        const reader = body.getReader();
        request.signal.addEventListener("abort", () => void reader.cancel().catch(() => {}), { once: true });
        try {
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
          controller.close();
        } catch (error) {
          if (!request.signal.aborted) log("bffStream: upstream stream broke", error);
          controller.close();
        } finally {
          request.signal.removeEventListener("abort", onDisconnect);
        }
      },
      cancel() {
        abort.abort();
      },
    });
    return new Response(relay, { status: 200, headers: STREAM_HEADERS });
  };
}
