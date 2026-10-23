import type { Metadata } from "next";
import Link from "next/link";

import { BlockFrame } from "@/components/site/block-frame";
import { BlockTabs } from "@/components/site/block-tabs";
import { source } from "@/components/site/example-source";
import { InstallCommand } from "@/components/site/install-command";
import { SecurityPanel } from "@/components/site/security-panel";
import { blockCategories, blocks, blockSecurity, type BlockDoc } from "@/content/blocks";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/registry/aedis/ui/collapsible";

export const metadata: Metadata = { title: "Blocks", description: "Whole screens for AI platforms, built only from Aedis UI components and installed with the CLI." };

function Block({ block }: { block: BlockDoc }) {
  const { security } = blockSecurity(block);
  return (
    <section aria-labelledby={`block-${block.name}`} className="space-y-3">
      <div className="space-y-1">
        <h2 id={`block-${block.name}`} className="text-title-3">
          <Link href={`/blocks/${block.name}`} className="focus-ring rounded-xs hover:underline">{block.name}</Link>
        </h2>
        <p className="text-callout text-muted-foreground">{block.description}</p>
      </div>
      <BlockFrame name={block.name} title={block.title} height={block.height} code={source(`registry/aedis/blocks/${block.name}.tsx`)} />
      <InstallCommand name={block.name} />
      <Collapsible>
        <CollapsibleTrigger className="focus-ring rounded-xs text-callout font-medium text-link underline-offset-4 hover:underline">
          Security panel: {security.sinks.join(", ")}
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3">
          <SecurityPanel name={block.name} security={security} />
        </CollapsibleContent>
      </Collapsible>
    </section>
  );
}

export default function Blocks() {
  return (
    <main className="mx-auto max-w-7xl space-y-7 px-4 pt-12 pb-24 md:px-6">
      <header className="enter max-w-3xl space-y-2.5">
        <h1 className="text-display">Blocks</h1>
        <p className="text-title-3 font-normal text-muted-foreground">
          Whole screens for AI platforms, built only from registry components. Copy one and wire it to your backend.
        </p>
      </header>
      <BlockTabs
        sections={blockCategories.map((category) => {
          const inCategory = blocks.filter((b) => b.category === category);
          return {
            category,
            content: inCategory.length ? (
              inCategory.map((b) => <Block key={b.name} block={b} />)
            ) : (
              <p className="text-callout text-muted-foreground">
                No block yet. Until there is one, see how to <Link href="/docs/micro-frontends" className="focus-ring rounded-xs text-link underline underline-offset-4">compose apps from frames and elements</Link>.
              </p>
            ),
          };
        })}
      />
    </main>
  );
}
