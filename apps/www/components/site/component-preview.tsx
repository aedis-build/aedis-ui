import type { ComponentType } from "react";

import { CodeBlock } from "@/registry/aedis/ui/code-block";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/aedis/ui/tabs";

/** One example with Preview and Code tabs over the same file: `code` is that file's source. */
export function ComponentPreview({ code, component: Example, label }: { code: string; component: ComponentType; label: string }) {
  return (
    <Tabs defaultValue="preview" className="gap-0 overflow-hidden rounded-xl border border-hairline bg-surface shadow-elevation-1">
      <div className="border-b border-hairline bg-background p-2">
        <TabsList aria-label={label}>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="preview" className="flex min-h-64 items-center justify-center p-8">
        {/* One track no wider than the preview: an auto track would grow to fit an example's longest line. */}
        <div className="grid w-full grid-cols-1 place-items-center">
          <Example />
        </div>
      </TabsContent>
      <TabsContent value="code">
        <CodeBlock lang="tsx" code={code} className="terminal max-h-[32rem] overflow-auto rounded-none border-0" />
      </TabsContent>
    </Tabs>
  );
}
