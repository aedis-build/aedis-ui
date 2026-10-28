"use client";

import * as React from "react";

import { defineMfElement, type MfElementProps } from "@/registry/aedis/lib/mf-element";
import { Input } from "@/registry/aedis/ui/input";
import { Label } from "@/registry/aedis/ui/label";

/** A React component published as <demo-greeting>: an attribute in, an event out, styles in its own shadow root. */
function Greeting({ name = "there", emit }: { name?: string } & MfElementProps) {
  return (
    <p className="card">
      Hello, {name}.{" "}
      <button type="button" onClick={() => emit("wave", { to: name })}>
        Wave back
      </button>
    </p>
  );
}

const css = `.card{font:14px/1.5 system-ui,sans-serif;margin:0}button{font:inherit;margin-left:6px;padding:2px 10px;border-radius:8px;border:1px solid color-mix(in srgb,currentColor 30%,transparent);background:transparent;color:inherit}`;

export default function MfElementDemo() {
  const [name, setName] = React.useState("Ana");
  const [waves, setWaves] = React.useState<string[]>([]);
  const el = React.useRef<HTMLElement>(null);
  React.useEffect(() => {
    defineMfElement("demo-greeting", Greeting, { attributes: { name: "string" }, events: ["wave"], css });
    const node = el.current;
    const onWave = (e: Event) => setWaves((w) => [`wave to ${(e as CustomEvent<{ to: string }>).detail.to}`, ...w].slice(0, 4));
    node?.addEventListener("wave", onWave);
    return () => node?.removeEventListener("wave", onWave);
  }, []);
  return (
    <div className="grid w-full max-w-sm gap-3">
      <div className="grid gap-2">
        <Label htmlFor="mfe-name">name attribute</Label>
        <Input id="mfe-name" value={name} maxLength={40} onChange={(e) => setName(e.currentTarget.value)} />
      </div>
      <div className="rounded-md border border-hairline p-3">{React.createElement("demo-greeting", { ref: el, name })}</div>
      <p role="status" className="text-footnote text-muted-foreground">
        Host heard: {waves.join(", ") || "nothing yet"}
      </p>
    </div>
  );
}
