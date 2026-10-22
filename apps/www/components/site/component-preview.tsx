import type { ComponentType } from "react";

import { exampleSource } from "@/components/site/example-source";
import { CodeBlock } from "@/registry/aedis/ui/code-block";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/aedis/ui/tabs";

/** One example with Preview and Code tabs over the same file. */
export function ComponentPreview({ file, component: Example, label }: { file: string; component: ComponentType; label: string }) {
  return (
    <Tabs defaultValue="preview" className="gap-0 overflow-hidden rounded-xl border border-hairline bg-surface shadow-elevation-1">
      <div className="border-b border-hairline bg-background p-2">
        <TabsList aria-label={label}>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="preview" className="flex min-h-64 items-center justify-center p-8">
        <div className="grid w-full place-items-center">
          <Example />
        </div>
      </TabsContent>
      <TabsContent value="code">
        <CodeBlock lang="tsx" code={exampleSource(file)} className="terminal max-h-[32rem] overflow-auto rounded-none border-0" />
      </TabsContent>
    </Tabs>
  );
}
