"use client";

import * as React from "react";

import { connectEventStream, type EventStreamOptions, type EventStreamState } from "@/registry/aedis/lib/event-stream";

export type { EventStreamState };

export type UseEventStreamOptions<T> = Omit<EventStreamOptions<T>, "signal" | "onState"> & {
  /** Pause the subscription (e.g. while signed out). */
  enabled?: boolean;
  /** Keep the connection but hold new events back (WCAG 2.2.2); turning it off delivers them in order. */
  paused?: boolean;
  /** Events held while paused; past it the oldest are dropped and counted. */
  maxBuffered?: number;
  /** Called whenever the held events change: how many wait, and how many older ones were dropped. */
  onBuffer?: (buffer: { buffered: number; dropped: number }) => void;
};

/**
 * Subscribes to a Server-Sent Events endpoint of this origin (see `connectEventStream`): resumes from the last event
 * id, reconnects with backoff, ignores malformed JSON and closes on unmount. While `paused`, events are held (up to
 * `maxBuffered`) and delivered in order on resume. Returns the connection state.
 */
export function useEventStream<T>(path: string | null, { enabled = true, paused = false, maxBuffered = 100, ...options }: UseEventStreamOptions<T>) {
  const [state, setState] = React.useState<EventStreamState>("closed");
  const latest = React.useRef(options);
  latest.current = options;
  // The limit can be changed, never removed: Infinity or NaN falls back to the default.
  const max = Number.isFinite(maxBuffered) ? Math.max(1, Math.floor(maxBuffered)) : 100;
  const held = React.useRef({ paused, max, events: [] as Parameters<EventStreamOptions<T>["onEvent"]>[], dropped: 0 });
  held.current.max = max;
  const events = (options.events ?? ["message"]).join("\u0000");

  React.useEffect(() => {
    if (!path || !enabled) return;
    const { close } = connectEventStream<T>(path, {
      ...latest.current,
      events: events.split("\u0000"),
      onEvent: (data, event) => {
        const h = held.current;
        if (!h.paused) return latest.current.onEvent(data, event);
        h.events.push([data, event]);
        if (h.events.length > h.max) h.dropped += h.events.splice(0, h.events.length - h.max).length;
        latest.current.onBuffer?.({ buffered: h.events.length, dropped: h.dropped });
      },
      onState: setState,
    });
    return () => {
      close();
      setState("closed");
      // Held events belong to the connection they came from: a new path, or enabled off and on again (another
      // session), starts with an empty buffer.
      const h = held.current;
      if (!h.events.length && !h.dropped) return;
      h.events = [];
      h.dropped = 0;
      latest.current.onBuffer?.({ buffered: 0, dropped: 0 });
    };
  }, [path, enabled, events]);

  // Switched here, not during render, so nothing new is delivered ahead of the held events.
  React.useEffect(() => {
    const h = held.current;
    h.paused = paused;
    if (paused || (!h.events.length && !h.dropped)) return;
    const flushed = h.events;
    h.events = [];
    h.dropped = 0;
    // One throwing handler must not swallow the rest of the buffer or leave the count on screen.
    let failure: { error: unknown } | undefined;
    for (const [data, event] of flushed) {
      try {
        latest.current.onEvent(data, event);
      } catch (error) {
        failure ??= { error };
      }
    }
    latest.current.onBuffer?.({ buffered: 0, dropped: 0 });
    if (failure) throw failure.error;
  }, [paused]);

  return state;
}
