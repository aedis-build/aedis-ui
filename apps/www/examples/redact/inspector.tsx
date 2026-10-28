"use client";

import * as React from "react";

import { redact, redactText } from "@/registry/aedis/lib/redact";
import { Label } from "@/registry/aedis/ui/label";
import { Textarea } from "@/registry/aedis/ui/textarea";

const sample = JSON.stringify({ to: "ana@studio.com", subject: "Invoice", headers: { Authorization: "Bearer sk-live-41f9" }, apiKey: "sk-live-41f9" }, null, 2);

/** What a tool call's arguments look like after redact(), before they reach the screen or a log. */
export default function RedactInspector() {
  const [input, setInput] = React.useState(sample);
  let shown: string;
  try {
    shown = JSON.stringify(redact(JSON.parse(input)), null, 2);
  } catch {
    shown = redactText(input);
  }
  return (
    <div className="grid w-full max-w-xl gap-4 sm:grid-cols-2">
      <div className="grid gap-2">
        <Label htmlFor="redact-input">Tool arguments (JSON or text)</Label>
        <Textarea id="redact-input" rows={8} maxLength={4000} className="font-mono text-footnote" value={input} onChange={(e) => setInput(e.currentTarget.value)} />
      </div>
      <div className="grid content-start gap-2">
        <p className="text-callout font-medium">Shown</p>
        <pre role="status" aria-label="Redacted" className="overflow-x-auto rounded-sm border border-hairline bg-surface p-3 font-mono text-footnote whitespace-pre-wrap">
          {shown}
        </pre>
      </div>
    </div>
  );
}
