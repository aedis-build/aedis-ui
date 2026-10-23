"use client";

import * as React from "react";

import { CLI } from "@/components/site/install-command";
import { installable, type DirectoryEntry } from "@/content/directory";
import { Badge } from "@/registry/aedis/ui/badge";
import { Input } from "@/registry/aedis/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/registry/aedis/ui/tabs";

const Check = ({ ok, label }: { ok: boolean; label: string }) => (
  <Badge variant="secondary" className={ok ? "text-success" : "text-destructive"}>
    <span aria-hidden="true">{ok ? "✓" : "✕"}</span>
    <span className="sr-only">{label}: {ok ? "yes" : "no"}</span>
  </Badge>
);

/** The Directory table, filtered by kind and by text. Rows come from content/directory.ts. */
export function DirectoryTable({ entries }: { entries: DirectoryEntry[] }) {
  const [kind, setKind] = React.useState("All");
  const [query, setQuery] = React.useState("");
  const q = query.trim().toLowerCase();
  const rows = entries.filter((e) => (kind === "All" || (kind === "Verified" ? installable(e) : e.kind === "Community")) && (!q || `${e.namespace} ${e.title} ${e.repository}`.toLowerCase().includes(q)));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={kind} onValueChange={(v) => setKind(String(v))}>
          <TabsList aria-label="Registries">
            {["All", "Verified", "Community"].map((k) => <TabsTrigger key={k} value={k}>{k}</TabsTrigger>)}
          </TabsList>
        </Tabs>
        <Input type="search" aria-label="Search registries" placeholder="Search registries" value={query} onChange={(e) => setQuery(e.target.value)} className="w-full sm:w-64" />
      </div>
      <div className="overflow-x-auto rounded-lg border border-hairline bg-surface">
        <table className="w-full min-w-[52rem] text-left text-callout">
          <thead className="text-footnote text-muted-foreground">
            <tr>
              {["Registry", "Items", "Signed", "Provenance", "Aedis lint", "Status", "Install"].map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.namespace} className="border-t border-hairline align-middle">
                <th scope="row" className="px-3 py-2.5 font-normal">
                  <span className="block font-semibold">{e.namespace}</span>
                  <span className="text-caption text-muted-foreground">{e.title} · {e.kind.toLowerCase()} · {e.repository}</span>
                </th>
                <td className="px-3 py-2.5 tabular-nums">{e.items}</td>
                <td className="px-3 py-2.5"><Check ok={e.signed} label="Signed" /></td>
                <td className="px-3 py-2.5"><Check ok={e.provenance} label="Provenance" /></td>
                <td className="px-3 py-2.5"><Check ok={e.lint} label="Aedis lint" /></td>
                <td className="px-3 py-2.5">
                  {installable(e) ? <Badge variant="secondary" className="text-success">Installable</Badge> : <Badge variant="secondary" className="text-warning">Needs --allow-unverified</Badge>}
                </td>
                <td className="px-3 py-2.5 font-mono text-footnote">
                  {e.namespace === "@aedis" ? `npx ${CLI} add ${e.example}` : `npx @aedis/cli add ${e.namespace}/${e.example} --registry github:${e.repository}@<tag>`}
                </td>
              </tr>
            ))}
            {rows.length ? null : (
              <tr className="border-t border-hairline">
                <td colSpan={7} className="px-3 py-4 text-muted-foreground">
                  {kind === "Community" ? "No community registry is listed yet. List yours: see below." : `No registry matches “${query}”.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
