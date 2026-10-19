"use client";

import * as React from "react";

export type EventStreamOptions<T> = {
  /** Called for every event with its parsed JSON data. */
  onEvent: (data: T, event: MessageEvent<string>) => void;
  /** Event name to listen to; "message" for unnamed events. */
  event?: string;
  /** Send cookies cross-origin. Same-origin requests always send them. */
  withCredentials?: boolean;
  /** Pause the subscription (e.g. while the tab is hidden or the user is signed out). */
  enabled?: boolean;
};

export type EventStreamState = "connecting" | "open" | "closed";

/**
 * Subscribes to a Server-Sent Events endpoint. The browser reconnects on its own and resends the last event id
 * (Last-Event-ID), so a server that honors it delivers what was missed. Malformed JSON events are ignored.
 */
export function useEventStream<T>(url: string | null, { onEvent, event = "message", withCredentials = false, enabled = true }: EventStreamOptions<T>) {
  const [state, setState] = React.useState<EventStreamState>("closed");
  const handler = React.useRef(onEvent);
  handler.current = onEvent;

  React.useEffect(() => {
    if (!url || !enabled || typeof EventSource === "undefined") return;
    const source = new EventSource(url, { withCredentials });
    setState("connecting");
    source.onopen = () => setState("open");
    source.onerror = () => setState(source.readyState === EventSource.CLOSED ? "closed" : "connecting");
    const listener = (e: MessageEvent<string>) => {
      let data: T;
      try {
        data = JSON.parse(e.data) as T;
      } catch {
        return;
      }
      handler.current(data, e);
    };
    source.addEventListener(event, listener);
    return () => {
      source.removeEventListener(event, listener);
      source.close();
      setState("closed");
    };
  }, [url, event, withCredentials, enabled]);

  return state;
}
