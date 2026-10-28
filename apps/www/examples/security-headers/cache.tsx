"use client";

import * as React from "react";

import { cachePolicyFor, securityHeaders, type CachePolicy } from "@/lib/security-headers";
import { Input } from "@/registry/aedis/ui/input";
import { Label } from "@/registry/aedis/ui/label";
import { Switch } from "@/registry/aedis/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/registry/aedis/ui/toggle-group";

// What a site's middleware would pass: public files every visitor sees alike, hashed assets forever, the rest private.
const lists = { public: ["/sitemap.xml", "/robots.txt", /^\/llms/], immutable: [/^\/_next\/static\//] };

/** The cache policy a path gets, and the headers that come out, with or without a nonce. */
export default function SecurityHeadersCache() {
  const [path, setPath] = React.useState("/sitemap.xml");
  const [choice, setChoice] = React.useState(["path"]);
  const [nonce, setNonce] = React.useState(false);
  const policy: CachePolicy = choice[0] === "path" || !choice[0] ? cachePolicyFor(path, lists) : (choice[0] as CachePolicy);
  let lines: string[];
  try {
    const h = securityHeaders({ ...(nonce ? { nonce: "r4nd0m" } : {}), cacheControl: policy });
    const script = h["Content-Security-Policy"]?.split("; ").find((d) => d.startsWith("script-src"));
    lines = [`Cache-Control: ${h["Cache-Control"]}`, `${script};`];
  } catch (e) {
    lines = [`Refused: ${(e as Error).message}`];
  }
  return (
    <div className="grid w-full min-w-0 max-w-xl grid-cols-1 gap-4">
      <ToggleGroup variant="segmented" size="sm" aria-label="Cache policy" value={choice} onValueChange={setChoice} className="w-full">
        <ToggleGroupItem value="path">By path</ToggleGroupItem>
        <ToggleGroupItem value="private">private</ToggleGroupItem>
        <ToggleGroupItem value="public">public</ToggleGroupItem>
        <ToggleGroupItem value="immutable">immutable</ToggleGroupItem>
      </ToggleGroup>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="grid gap-2">
          <Label htmlFor="cache-path">Path</Label>
          <Input id="cache-path" value={path} maxLength={200} onChange={(e) => setPath(e.currentTarget.value)} />
        </div>
        <div className="flex items-center gap-2 sm:pb-2">
          <Switch id="cache-nonce" checked={nonce} onCheckedChange={setNonce} />
          <Label htmlFor="cache-nonce">Has a nonce</Label>
        </div>
      </div>
      <p className="text-footnote text-muted-foreground">Policy: {policy}</p>
      <div role="status" aria-label="Cache headers">
        <ul className="overflow-x-auto rounded-sm border border-hairline bg-surface p-3 font-mono text-footnote">
          {lines.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
