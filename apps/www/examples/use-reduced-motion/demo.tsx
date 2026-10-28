"use client";

import { useReducedMotion } from "@/registry/aedis/hooks/use-reduced-motion";

/** The hook follows the system setting live; turn "reduce motion" on in your system and the dot stops. */
export default function UseReducedMotionDemo() {
  const reduced = useReducedMotion();
  return (
    <div className="flex items-center gap-3">
      <span aria-hidden="true" data-moving={!reduced || undefined} className="size-3 rounded-full bg-primary data-moving:animate-ping" />
      <p role="status" className="text-callout">
        Reduced motion: <strong>{reduced ? "on, so nothing moves" : "off"}</strong>
      </p>
    </div>
  );
}
