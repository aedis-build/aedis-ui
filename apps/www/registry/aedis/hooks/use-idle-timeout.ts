"use client";

import * as React from "react";

/** Dispatch on window to count activity the page cannot see, e.g. inside an embedded app (mf-context does). */
export const ACTIVITY_EVENT = "aedis:activity";

const ACTIVITY = ["pointerdown", "keydown", "wheel", "touchstart", ACTIVITY_EVENT] as const;

/**
 * Calls onIdle once the person has not touched the page for the given time, so the app can end the session.
 * Any pointer, key, wheel or touch restarts the countdown; the tab coming back into view checks it at once, so
 * a laptop that slept past the limit signs out on wake instead of after another full period.
 *
 * With `warnMs`, `warning` turns true that long before the end, so the app can say so and offer to stay (WCAG 2.2.1):
 * any activity, Escape or a press on "Stay signed in" included, clears it and starts over; `stay()` does the same.
 */
export function useIdleTimeout(ms: number, onIdle: () => void, enabled = true, warnMs = 0) {
  const callback = React.useRef(onIdle);
  callback.current = onIdle;
  const [warning, setWarning] = React.useState(false);
  const restart = React.useRef(() => {});

  React.useEffect(() => {
    if (!enabled) return;
    let last = Date.now();
    let timer: ReturnType<typeof setTimeout>;
    let warnTimer: ReturnType<typeof setTimeout>;
    const fire = () => {
      setWarning(false);
      callback.current();
    };
    const arm = () => {
      clearTimeout(timer);
      clearTimeout(warnTimer);
      timer = setTimeout(fire, ms);
      if (warnMs > 0 && warnMs < ms) warnTimer = setTimeout(() => setWarning(true), ms - warnMs);
    };
    const touch = () => {
      last = Date.now();
      setWarning(false);
      arm();
    };
    const check = () => {
      if (document.visibilityState === "visible" && Date.now() - last >= ms) fire();
    };
    restart.current = touch;
    for (const type of ACTIVITY) window.addEventListener(type, touch, { passive: true });
    document.addEventListener("visibilitychange", check);
    arm();
    return () => {
      clearTimeout(timer);
      clearTimeout(warnTimer);
      restart.current = () => {};
      setWarning(false);
      for (const type of ACTIVITY) window.removeEventListener(type, touch);
      document.removeEventListener("visibilitychange", check);
    };
  }, [ms, enabled, warnMs]);

  const stay = React.useCallback(() => restart.current(), []);
  return { warning, stay };
}
