"use client";

import * as React from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/aedis/ui/tabs";

/** The Blocks page's category tabs over sections rendered on the server. */
export function BlockTabs({ sections }: { sections: { category: string; content: React.ReactNode }[] }) {
  return (
    <Tabs defaultValue={sections[0]?.category} className="gap-7">
      <TabsList aria-label="Category" className="h-auto flex-wrap justify-start self-start">
        {sections.map((s) => <TabsTrigger key={s.category} value={s.category}>{s.category}</TabsTrigger>)}
      </TabsList>
      {sections.map((s) => (
        <TabsContent key={s.category} value={s.category} className="space-y-12">
          {s.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
