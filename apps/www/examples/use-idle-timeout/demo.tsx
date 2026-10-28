"use client";

import * as React from "react";

import { useIdleTimeout } from "@/registry/aedis/hooks/use-idle-timeout";
import { Button } from "@/registry/aedis/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/registry/aedis/ui/toggle-group";

/** A session that ends after a quiet spell, with a warning before. "Fast-forward" makes the spell 6 seconds long. */
export default function UseIdleTimeoutDemo() {
  const [speed, setSpeed] = React.useState(["real"]);
  const [ended, setEnded] = React.useState(false);
  const fast = speed[0] === "fast";
  const { warning, stay } = useIdleTimeout(fast ? 6_000 : 15 * 60_000, () => setEnded(true), !ended, fast ? 3_000 : 60_000);
  return (
    <div className="grid w-full max-w-md gap-4">
      <ToggleGroup variant="segmented" aria-label="Clock" value={speed} onValueChange={setSpeed}>
        <ToggleGroupItem value="real">15 minutes</ToggleGroupItem>
        <ToggleGroupItem value="fast">Fast-forward: 6 seconds</ToggleGroupItem>
      </ToggleGroup>
      <p role="status" className="text-callout">
        {ended ? "Signed out after the quiet spell." : warning ? "You will be signed out soon." : "Signed in. Any key, click or scroll counts as activity."}
      </p>
      {warning && !ended ? (
        <Button className="justify-self-start" onClick={stay}>
          Stay signed in
        </Button>
      ) : null}
      {ended ? (
        <Button variant="outline" className="justify-self-start" onClick={() => setEnded(false)}>
          Sign in again
        </Button>
      ) : null}
    </div>
  );
}
