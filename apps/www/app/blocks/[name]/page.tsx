import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BlockFrame } from "@/components/site/block-frame";
import { source } from "@/components/site/example-source";
import { InstallCommand } from "@/components/site/install-command";
import { JsonLd } from "@/components/site/json-ld";
import { SecurityPanel } from "@/components/site/security-panel";
import { blocks, blockSecurity } from "@/content/blocks";
import { pageMetadata } from "@/content/share";
import { CodeBlock } from "@/registry/aedis/ui/code-block";
import { Kbd } from "@/registry/aedis/ui/kbd";

export const dynamicParams = false;

export function generateStaticParams() {
  return blocks.map((b) => ({ name: b.name }));
}

export async function generateMetadata({ params }: { params: Promise<{ name: string }> }): Promise<Metadata> {
  const { name } = await params;
  return pageMetadata(`/blocks/${name}`);
}

export default async function BlockPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const block = blocks.find((b) => b.name === name);
  if (!block) notFound();
  const { parts, security } = blockSecurity(block);

  return (
    <main className="mx-auto max-w-6xl space-y-10 px-4 pt-12 pb-24 md:px-6">
      <JsonLd path={`/blocks/${name}`} />
      <header className="space-y-3">
        <p className="text-footnote text-muted-foreground"><Link href="/blocks" className="focus-ring rounded-xs hover:text-foreground">Blocks</Link> › {block.title}</p>
        <h1 className="text-title-1">{block.title}</h1>
        <p className="max-w-3xl text-body text-muted-foreground">{block.description}</p>
      </header>

      <BlockFrame name={name} title={block.title} height={block.height} code={source(`registry/aedis/blocks/${name}.tsx`)} />

      <section className="space-y-3">
        <h2 className="text-title-2">Installation</h2>
        <InstallCommand name={name} />
        <p className="text-callout text-muted-foreground">
          The CLI verifies the signed registry release, then adds the block and everything it is built from:{" "}
          {parts.map((p, i) => (
            <span key={p.name}>{i > 0 ? ", " : ""}<Link href={`/docs/${p.name}`} className="focus-ring rounded-xs text-link underline-offset-4 hover:underline">{p.title}</Link></span>
          ))}
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-title-2">Usage</h2>
        <CodeBlock lang="tsx" code={block.usage} />
        <p className="text-footnote text-muted-foreground">The preview is wired with sample data in <code className="font-mono">examples/{block.demoFile}.tsx</code>; pass your own data and handlers.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-title-2">Security</h2>
        <SecurityPanel name={name} security={security} />
      </section>

      <section className="space-y-3">
        <h2 className="text-title-2">Accessibility and motion</h2>
        {block.accessibility.keyboard?.length ? (
          <dl className="grid gap-x-6 gap-y-2 text-callout sm:grid-cols-[auto_1fr]">
            {block.accessibility.keyboard.map(([key, action]) => (
              <div key={key} className="contents">
                <dt><Kbd>{key}</Kbd></dt>
                <dd>{action}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        <ul className="list-disc space-y-1 pl-5 text-callout">{block.accessibility.notes?.map((n) => <li key={n}>{n}</li>)}</ul>
        {block.accessibility.motion ? <p className="text-callout text-muted-foreground">{block.accessibility.motion}</p> : null}
      </section>
    </main>
  );
}
