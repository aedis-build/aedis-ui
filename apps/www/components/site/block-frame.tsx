"use client";

import * as React from "react";

import { CodeBlock } from "@/registry/aedis/ui/code-block";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/aedis/ui/tabs";

const viewports = { Desktop: "100%", Tablet: "768px", Mobile: "390px" } as const;
type Viewport = keyof typeof viewports;

/**
 * A block at full size: Preview shows /blocks/view/<name> in a same-origin frame whose width follows the viewport
 * switch, so the block's own media queries run as they would on that device (the frame resizes, it never zooms).
 * Code shows the block's file. Only the view pages may be framed, and only by this site (scripts/headers.ts).
 */
export function BlockFrame({ name, title, height, code }: { name: string; title: string; height: number; code: string }) {
  const [viewport, setViewport] = React.useState<Viewport>("Desktop");
  const [tab, setTab] = React.useState("preview");
  return (
    <Tabs value={tab} onValueChange={(v) => setTab(String(v))} className="gap-0 overflow-hidden rounded-xl border border-hairline bg-surface shadow-elevation-1">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline bg-background p-2">
        <TabsList aria-label={`${title} block`}>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
        </TabsList>
        {tab === "preview" ? (
          <Tabs value={viewport} onValueChange={(v) => setViewport(v as Viewport)}>
            <TabsList aria-label="Viewport" className="hidden sm:inline-flex">
              {Object.keys(viewports).map((v) => <TabsTrigger key={v} value={v}>{v}</TabsTrigger>)}
            </TabsList>
          </Tabs>
        ) : null}
      </div>
      <TabsContent value="preview" className="flex justify-center bg-muted/40">
        <iframe
          src={`/blocks/view/${name}`}
          title={`${title} preview, ${viewport.toLowerCase()} width`}
          loading="lazy"
          className="block max-w-full border-x border-hairline bg-background transition-[width] duration-(--duration-fast) ease-out motion-reduce:transition-none"
          style={{ width: viewports[viewport], height }}
        />
      </TabsContent>
      <TabsContent value="code">
        <CodeBlock lang="tsx" code={code} className="terminal max-h-[32rem] overflow-auto rounded-none border-0" />
      </TabsContent>
    </Tabs>
  );
}
