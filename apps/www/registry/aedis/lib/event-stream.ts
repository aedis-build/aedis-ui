import { stripInvisible } from "@/lib/untrusted";

export type SseEvent = { type: string; data: string; id: string };

export type SseParserOptions = {
  /** Events whose data grows past this many UTF-8 bytes are dropped whole. */
  maxEventBytes?: number;
  onEvent: (event: SseEvent) => void;
  /** The server's `retry:` field, in milliseconds. */
  onRetry?: (ms: number) => void;
};

/** Last-Event-ID is echoed in a header on reconnect: keep it short and printable (aedis-dotnet accepts 256). */
export const MAX_EVENT_ID = 256;
const PRINTABLE_ID = /^[\x20-\x7E]*$/;

function utf8Length(s: string) {
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    n += c < 0x80 ? 1 : c < 0x800 ? 2 : c >= 0xd800 && c <= 0xdbff ? (i++, 4) : 3;
  }
  return n;
}

/**
 * Incremental Server-Sent Events parser (WHATWG event stream format) fed with already decoded text. Chunk boundaries
 * never change the result. Hidden code points are stripped from each assembled event, never per chunk.
 */
export function createSseParser({ maxEventBytes = 64 * 1024, onEvent, onRetry }: SseParserOptions) {
  let partial = "";
  let skipLine = false;
  let data: string[] = [];
  let size = 0;
  let type = "";
  let id = "";
  let oversized = false;

  const reset = () => {
    data = [];
    size = 0;
    type = "";
    oversized = false;
  };

  const dispatch = () => {
    if (!oversized && data.length) onEvent({ type: type || "message", data: stripInvisible(data.join("\n")), id });
    reset();
  };

  const line = (text: string) => {
    if (text === "") return dispatch();
    if (text.startsWith(":")) return; // comment, e.g. the server's heartbeat
    const colon = text.indexOf(":");
    const field = colon === -1 ? text : text.slice(0, colon);
    let value = colon === -1 ? "" : text.slice(colon + 1);
    if (value.startsWith(" ")) value = value.slice(1);
    if (field === "data") {
      size += utf8Length(value) + 1;
      if (size > maxEventBytes) oversized = true;
      else data.push(value);
    } else if (field === "event") type = value;
    else if (field === "id") {
      if (value.length <= MAX_EVENT_ID && PRINTABLE_ID.test(value)) id = value;
    } else if (field === "retry" && /^\d{1,9}$/.test(value)) onRetry?.(Number(value));
  };

  return {
    push(chunk: string) {
      let text = partial + chunk;
      partial = "";
      let start = 0;
      for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c !== "\n" && c !== "\r") continue;
        // A lone \r at the end may be the first half of \r\n: wait for the next chunk.
        if (c === "\r" && i === text.length - 1) {
          partial = skipLine ? "\r" : text.slice(start);
          return;
        }
        if (skipLine) skipLine = false;
        else line(text.slice(start, i));
        if (c === "\r" && text[i + 1] === "\n") i++;
        start = i + 1;
      }
      const rest = text.slice(start);
      // A line that never ends must not grow without bound: drop it and the event it belongs to.
      if (skipLine || utf8Length(rest) > maxEventBytes) {
        skipLine = true;
        oversized = true;
      } else partial = rest;
    },
    /** End of stream: an event without its final blank line is not dispatched (as the format specifies). */
    end() {
      partial = "";
      skipLine = false;
      reset();
    },
  };
}

export type EventStreamState = "connecting" | "open" | "retrying" | "closed" | "error";

export type EventStreamOptions<T> = {
  /** Called with the parsed JSON of every allowed event. Malformed JSON is ignored. */
  onEvent: (data: T, event: { type: string; id: string }) => void;
  /** Event types to accept; everything else is ignored. */
  events?: string[];
  onState?: (state: EventStreamState) => void;
  /** Resume after this id (sent as Last-Event-ID). */
  lastEventId?: string;
  signal?: AbortSignal;
  maxEventBytes?: number;
  /** After this many bytes the connection is closed and reopened from the last id. */
  maxConnectionBytes?: number;
  /** The server's heartbeat; with no data for twice as long the connection is considered dead. */
  heartbeatMs?: number;
  /** Attempts in a row before giving up. */
  maxRetries?: number;
  /** First retry delay, until the server sends `retry:`. */
  retryMs?: number;
  maxRetryMs?: number;
};

const TOKEN_IN_QUERY = /[?&](access[_-]?token|id[_-]?token|token|jwt|bearer|auth|authorization|api[_-]?key|session|sid)=/i;

/** Throws unless the path is relative to this origin and carries no credential in the query string. */
export function assertStreamPath(path: string) {
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) {
    throw new Error("event stream: path must be relative to this origin, e.g. /api/conversations/42/events");
  }
  if (TOKEN_IN_QUERY.test(path)) throw new Error("event stream: never put a token in the query string; the session cookie authenticates the stream");
}

class Retryable extends Error {}

/**
 * Opens a Server-Sent Events stream with fetch (EventSource cannot send headers or refuse redirects) under the same
 * rules as `api()`: same-origin path, cookies same-origin only, redirects refused, X-Requested-With. Resumes with
 * Last-Event-ID, honours the server's retry, backs off with jitter and gives up after `maxRetries`. Returns `close`.
 */
export function connectEventStream<T>(path: string, options: EventStreamOptions<T>) {
  assertStreamPath(path);
  const {
    onEvent,
    events = ["message"],
    onState,
    signal,
    maxEventBytes = 64 * 1024,
    maxConnectionBytes = 16 * 1024 * 1024,
    heartbeatMs = 15_000,
    maxRetries = 8,
    maxRetryMs = 30_000,
  } = options;
  let retryMs = options.retryMs ?? 1_000;
  let lastId = options.lastEventId && options.lastEventId.length <= MAX_EVENT_ID && PRINTABLE_ID.test(options.lastEventId) ? options.lastEventId : "";
  const stop = new AbortController();
  const close = () => stop.abort();
  signal?.addEventListener("abort", close);
  const setState = (s: EventStreamState) => !stop.signal.aborted && onState?.(s);

  const wait = (ms: number) =>
    new Promise<void>((resolve) => {
      const t = setTimeout(resolve, ms);
      stop.signal.addEventListener("abort", () => (clearTimeout(t), resolve()), { once: true });
    });

  async function once() {
    const attempt = new AbortController();
    const abort = () => attempt.abort();
    stop.signal.addEventListener("abort", abort, { once: true });
    let watchdog: ReturnType<typeof setTimeout> | undefined;
    const alive = () => {
      clearTimeout(watchdog);
      watchdog = setTimeout(abort, heartbeatMs * 2);
    };
    try {
      alive();
      const response = await fetch(path, {
        method: "GET",
        credentials: "same-origin",
        redirect: "error",
        referrerPolicy: "same-origin",
        cache: "no-store",
        signal: attempt.signal,
        headers: { Accept: "text/event-stream", "X-Requested-With": "XMLHttpRequest", ...(lastId ? { "Last-Event-ID": lastId } : {}) },
      });
      // 204 is the server saying "do not reconnect"; other 4xx will not get better by retrying.
      if (response.status === 204) return "done";
      if (!response.ok) {
        if (response.status >= 400 && response.status < 500 && response.status !== 408 && response.status !== 429) return "fatal";
        throw new Retryable(String(response.status));
      }
      if (!/^text\/event-stream\b/i.test(response.headers.get("content-type") ?? "") || !response.body) return "fatal";
      setState("open");
      const parser = createSseParser({
        maxEventBytes,
        onRetry: (ms) => (retryMs = Math.min(ms, maxRetryMs)),
        onEvent: (e) => {
          if (e.id) lastId = e.id;
          if (!events.includes(e.type)) return;
          let data: T;
          try {
            data = JSON.parse(e.data) as T;
          } catch {
            return;
          }
          onEvent(data, { type: e.type, id: e.id });
        },
      });
      const reader = response.body.getReader();
      // Abort (close, watchdog, byte limit) must end a pending read even if the body ignores the fetch signal.
      attempt.signal.addEventListener("abort", () => void reader.cancel().catch(() => {}), { once: true });
      const decoder = new TextDecoder("utf-8");
      let total = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        alive();
        total += value.byteLength;
        if (total > maxConnectionBytes) {
          abort();
          throw new Retryable("connection limit");
        }
        parser.push(decoder.decode(value, { stream: true }));
      }
      parser.push(decoder.decode());
      parser.end();
      // A normal end (the server's maximum connection time): reconnect from the last id.
      return "ended";
    } finally {
      clearTimeout(watchdog);
      stop.signal.removeEventListener("abort", abort);
    }
  }

  void (async () => {
    let failures = 0;
    while (!stop.signal.aborted) {
      setState(failures ? "retrying" : "connecting");
      let result: string;
      try {
        result = await once();
      } catch {
        result = "retry";
      }
      if (stop.signal.aborted) break;
      if (result === "done") return void (setState("closed"), close());
      if (result === "fatal") return void (setState("error"), close());
      failures = result === "ended" ? 0 : failures + 1;
      if (failures > maxRetries) return void (setState("error"), close());
      const backoff = Math.min(maxRetryMs, retryMs * 2 ** Math.max(0, failures - 1));
      await wait(backoff * (0.5 + Math.random() / 2));
    }
    onState?.("closed");
  })();

  return { close };
}
