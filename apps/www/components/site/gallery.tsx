"use client";

import * as React from "react";
import Link from "next/link";

import { Badge } from "@/registry/aedis/ui/badge";
import { Input } from "@/registry/aedis/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/registry/aedis/ui/tabs";

export type GalleryItem = { name: string; title: string; description: string; category: string; sinks: string[]; preview?: React.ReactNode };

/**
 * Every item as a card that links to its page: a live, inert preview when it has one, its name, category and the sinks
 * from its security panel. Category tabs and a filter field narrow it; one section per category.
 */
export function Gallery({ items, categories }: { items: GalleryItem[]; categories: string[] }) {
  const [category, setCategory] = React.useState("All");
  const [query, setQuery] = React.useState("");
  const q = query.trim().toLowerCase();
  const shown = items.filter((i) => (category === "All" || i.category === category) && (!q || `${i.title} ${i.name} ${i.description}`.toLowerCase().includes(q)));
  const sections = categories.map((c) => ({ title: c, items: shown.filter((i) => i.category === c) })).filter((s) => s.items.length);
  return (
    <div className="space-y-9">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={category} onValueChange={(v) => setCategory(String(v))}>
          <TabsList aria-label="Category" className="h-auto flex-wrap justify-start">
            {["All", ...categories].map((c) => <TabsTrigger key={c} value={c}>{c}</TabsTrigger>)}
          </TabsList>
        </Tabs>
        <Input type="search" aria-label="Filter components" placeholder="Filter components" value={query} onChange={(e) => setQuery(e.target.value)} className="w-full sm:w-60" />
      </div>
      <p className="sr-only" aria-live="polite">{shown.length} shown</p>
      {sections.length ? null : <p className="text-callout text-muted-foreground">Nothing matches “{query}”.</p>}
      {sections.map((s) => (
        <section key={s.title} aria-labelledby={`cat-${s.title}`} className="space-y-3.5">
          <h2 id={`cat-${s.title}`} className="text-title-2">{s.title}</h2>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {s.items.map((i) => (
              <li key={i.name}>
                <Link href={`/docs/${i.name}`} className="lift focus-ring flex h-full flex-col overflow-hidden rounded-xl border border-hairline bg-surface shadow-elevation-1">
                  {/* A picture of the component: inert, so it is neither focusable nor read twice. */}
                  <span inert className="pointer-events-none flex h-40 items-center justify-center overflow-hidden bg-background p-3">
                    {i.preview ? (
                      <span className="flex w-[160%] shrink-0 scale-[0.62] justify-center">{i.preview}</span>
                    ) : (
                      <span className="flex max-w-56 flex-col gap-1.5 text-center">
                        <span className="font-mono text-footnote">{i.name}</span>
                        <span className="text-caption text-muted-foreground">{i.description}</span>
                      </span>
                    )}
                  </span>
                  <span className="flex flex-col items-start gap-1.5 px-4 pt-3 pb-4">
                    <span className="text-headline">{i.title}</span>
                    <span className="flex flex-wrap gap-1.5">
                      <Badge variant="secondary">{i.category}</Badge>
                      {i.sinks.map((sink) => <Badge key={sink} variant="outline" className="text-link">{sink}</Badge>)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
