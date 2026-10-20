"use client";

import * as React from "react";

import { connectEventStream, type EventStreamOptions, type EventStreamState } from "@/registry/aedis/lib/event-stream";

export type { EventStreamState };

export type UseEventStreamOptions<T> = Omit<EventStreamOptions<T>, "signal" | "onState"> & {
  /** Pause the subscription (e.g. while signed out). */
  enabled?: boolean;
};

/**
 * Subscribes to a Server-Sent Events endpoint of this origin (see `connectEventStream`): resumes from the last event
 * id, reconnects with backoff, ignores malformed JSON and closes on unmount. Returns the connection state.
 */
export function useEventStream<T>(path: string | null, { enabled = true, ...options }: UseEventStreamOptions<T>) {
  const [state, setState] = React.useState<EventStreamState>("closed");
  const latest = React.useRef(options);
  latest.current = options;
  const events = (options.events ?? ["message"]).join("\u0000");

  React.useEffect(() => {
    if (!path || !enabled) return;
    const { close } = connectEventStream<T>(path, {
      ...latest.current,
      events: events.split("\u0000"),
      onEvent: (data, event) => latest.current.onEvent(data, event),
      onState: setState,
    });
    return () => {
      close();
      setState("closed");
    };
  }, [path, enabled, events]);

  return state;
}
