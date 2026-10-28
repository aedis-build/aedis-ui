"use client";

import * as React from "react";

import { hasInvisible, safeUrl, stripInvisible } from "@/lib/untrusted";
import { Input } from "@/registry/aedis/ui/input";
import { Label } from "@/registry/aedis/ui/label";
import { Textarea } from "@/registry/aedis/ui/textarea";

const reveal = (text: string) => [...text].map((c) => (stripInvisible(c) ? c : `[U+${c.codePointAt(0)!.toString(16).toUpperCase()}]`)).join("");

/** What the untrusted helpers see in a text and a link that look harmless. */
export default function UntrustedInspector() {
  // Hidden Unicode tags spell an instruction an agent would read and a person would not see.
  const [text, setText] = React.useState("Pay the invoice\u{E0049}\u{E0047}\u{E004E}\u{E004F}\u{E0052}\u{E0045} today");
  const [url, setUrl] = React.useState("javascript:alert(document.cookie)");
  return (
    <div className="grid w-full max-w-xl gap-4">
      <div className="grid gap-2">
        <Label htmlFor="untrusted-text">Text from a model or a person</Label>
        <Textarea id="untrusted-text" allowInvisible rows={2} maxLength={500} value={text} onChange={(e) => setText(e.currentTarget.value)} />
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-callout">
        <dt className="text-muted-foreground">Hidden characters</dt>
        <dd>{hasInvisible(text) ? "Yes" : "None"}</dd>
        <dt className="text-muted-foreground">As stored</dt>
        <dd className="font-mono text-footnote break-all">{reveal(text)}</dd>
        <dt className="text-muted-foreground">stripInvisible</dt>
        <dd className="font-mono text-footnote break-all">{stripInvisible(text)}</dd>
      </dl>
      <div className="grid gap-2">
        <Label htmlFor="untrusted-url">A link</Label>
        <Input id="untrusted-url" value={url} maxLength={500} onChange={(e) => setUrl(e.currentTarget.value)} />
        <p className="text-callout">safeUrl: {safeUrl(url) ? <code className="font-mono text-footnote break-all">{safeUrl(url)}</code> : "refused"}</p>
      </div>
    </div>
  );
}
