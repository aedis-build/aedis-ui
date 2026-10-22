"use client";

import * as React from "react";
import Link from "next/link";

import { Badge } from "@/registry/aedis/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/aedis/ui/tabs";

export type GalleryItem = { name: string; title: string; category: string; preview: React.ReactNode };

/** Every component as a live, inert preview that links to its page, filtered by category. */
export function Gallery({ items, categories }: { items: GalleryItem[]; categories: string[] }) {
  const [category, setCategory] = React.useState("All");
  const shown = category === "All" ? items : items.filter((i) => i.category === category);
  return (
    <Tabs value={category} onValueChange={(v) => setCategory(String(v))} className="gap-6">
      <TabsList aria-label="Category" className="h-auto flex-wrap justify-start">
        {["All", ...categories].map((c) => <TabsTrigger key={c} value={c}>{c}</TabsTrigger>)}
      </TabsList>
      <TabsContent value={category}>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((i) => (
            <li key={i.name}>
              <Link href={`/docs/${i.name}`} className="lift focus-ring flex h-full flex-col overflow-hidden rounded-xl border border-hairline bg-surface shadow-elevation-1">
                {/* A picture of the component: inert, so it is neither focusable nor read twice. */}
                <span inert className="pointer-events-none flex h-44 items-center justify-center overflow-hidden bg-background">
                  <span className="flex w-[150%] shrink-0 scale-[0.66] justify-center">{i.preview}</span>
                </span>
                <span className="flex flex-col items-start gap-1.5 px-4 pt-3 pb-4">
                  <span className="text-headline">{i.title}</span>
                  <Badge variant="secondary">{i.category}</Badge>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </TabsContent>
    </Tabs>
  );
}
