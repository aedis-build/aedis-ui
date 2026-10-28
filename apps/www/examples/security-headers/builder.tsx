"use client";

import * as React from "react";

import { allowedOrigins } from "@/lib/untrusted";
import { securityHeaders } from "@/lib/security-headers";
import { Field, FieldControl, FieldDescription, FieldLabel } from "@/registry/aedis/ui/field";
import { Label } from "@/registry/aedis/ui/label";
import { Switch } from "@/registry/aedis/ui/switch";
import { Textarea } from "@/registry/aedis/ui/textarea";

const lines = (text: string) => text.split("\n").map((l) => l.trim()).filter(Boolean);

/** Builds the headers as the server would, from origins typed one per line, and shows what was dropped. */
export default function SecurityHeadersBuilder() {
  const [media, setMedia] = React.useState("https://media.rlfn.studio\nhttps://*.cdn.example");
  const [fonts, setFonts] = React.useState("");
  const [upgrade, setUpgrade] = React.useState(true);
  const csp = securityHeaders({ nonce: "r4nd0m", mediaSrc: lines(media), fontSrc: lines(fonts), upgradeInsecureRequests: upgrade })["Content-Security-Policy"].split("; ");
  const dropped = [...lines(media), ...lines(fonts)].filter((o) => allowedOrigins([o]).length === 0);
  return (
    <div className="grid w-full max-w-xl gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="mediaSrc">
          <FieldLabel>mediaSrc</FieldLabel>
          <FieldControl render={<Textarea rows={3} maxLength={1000} className="font-mono text-footnote" />} value={media} onChange={(e) => setMedia(e.currentTarget.value)} />
          <FieldDescription>One origin per line.</FieldDescription>
        </Field>
        <Field name="fontSrc">
          <FieldLabel>fontSrc</FieldLabel>
          <FieldControl render={<Textarea rows={3} maxLength={1000} className="font-mono text-footnote" />} value={fonts} onChange={(e) => setFonts(e.currentTarget.value)} />
          <FieldDescription>One origin per line.</FieldDescription>
        </Field>
      </div>
      <div className="flex items-center gap-2">
        <Switch id="upgrade" checked={upgrade} onCheckedChange={setUpgrade} />
        <Label htmlFor="upgrade">upgradeInsecureRequests</Label>
      </div>
      <div role="status" className="grid gap-2">
        <p className="text-footnote text-muted-foreground">{dropped.length ? `Dropped, not an exact origin: ${dropped.join(", ")}` : "Every origin is exact."}</p>
        <ul aria-label="Content-Security-Policy" className="overflow-x-auto rounded-sm border border-hairline bg-surface p-3 font-mono text-footnote">
          {csp.map((d) => (
            <li key={d}>{d};</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
