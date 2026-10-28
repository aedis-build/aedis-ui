"use client";

import * as React from "react";

import { embeddedAppHeaders, hostAppHeaders } from "@/lib/mf-embed-headers";
import { Input } from "@/registry/aedis/ui/input";
import { Label } from "@/registry/aedis/ui/label";

const pick = (h: Record<string, string>) => h["Content-Security-Policy"].split("; ").filter((d) => /^frame-(src|ancestors)/.test(d));

/** The framing rules each side's headers carry, from the origins you give: the host may frame the app, and only it. */
export default function MfEmbedHeadersBuilder() {
  const [host, setHost] = React.useState("https://backoffice.example.com");
  const [app, setApp] = React.useState("https://agent.example.com");
  const rows = [
    ["Host app", pick(hostAppHeaders({ nonce: "n", frameOrigins: [app] }))],
    ["Embedded app", [...pick(embeddedAppHeaders({ nonce: "n", hostOrigins: [host] })), `X-Frame-Options: ${embeddedAppHeaders({ nonce: "n", hostOrigins: [host] })["X-Frame-Options"]}`]],
  ] as const;
  return (
    <div className="grid w-full max-w-xl gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="meh-host">Host origin</Label>
          <Input id="meh-host" value={host} maxLength={200} onChange={(e) => setHost(e.currentTarget.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="meh-app">Embedded app origin</Label>
          <Input id="meh-app" value={app} maxLength={200} onChange={(e) => setApp(e.currentTarget.value)} />
        </div>
      </div>
      <dl aria-label="Framing headers" className="grid gap-2 font-mono text-footnote">
        {rows.map(([side, lines]) => (
          <div key={side}>
            <dt className="font-sans text-callout font-medium">{side}</dt>
            {lines.map((l) => (
              <dd key={l} className="break-all">
                {l}
              </dd>
            ))}
          </div>
        ))}
      </dl>
    </div>
  );
}
