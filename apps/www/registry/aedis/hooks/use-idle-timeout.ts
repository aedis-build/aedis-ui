"use client";

import * as React from "react";

const ACTIVITY = ["pointerdown", "keydown", "wheel", "touchstart"] as const;

/**
 * Calls onIdle once the person has not touched the page for the given time, so the app can end the session.
 * Any pointer, key, wheel or touch restarts the countdown; the tab coming back into view checks it at once, so
 * a laptop that slept past the limit signs out on wake instead of after another full period.
 */
export function useIdleTimeout(ms: number, onIdle: () => void, enabled = true) {
  const callback = React.useRef(onIdle);
  callback.current = onIdle;

  React.useEffect(() => {
    if (!enabled) return;
    let last = Date.now();
    let timer: ReturnType<typeof setTimeout>;
    const fire = () => callback.current();
    const arm = () => {
      clearTimeout(timer);
      timer = setTimeout(fire, ms);
    };
    const touch = () => {
      last = Date.now();
      arm();
    };
    const check = () => {
      if (document.visibilityState === "visible" && Date.now() - last >= ms) fire();
    };
    for (const type of ACTIVITY) window.addEventListener(type, touch, { passive: true });
    document.addEventListener("visibilitychange", check);
    arm();
    return () => {
      clearTimeout(timer);
      for (const type of ACTIVITY) window.removeEventListener(type, touch);
      document.removeEventListener("visibilitychange", check);
    };
  }, [ms, enabled]);
}
