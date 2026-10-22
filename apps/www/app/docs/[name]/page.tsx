import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { ComponentPreview } from "@/components/site/component-preview";
import { InstallCommand } from "@/components/site/install-command";
import { Toc } from "@/components/site/toc";
import { components, type ApiPart, type Prop } from "@/content/components";
import registry from "@/registry.json";
import { Badge } from "@/registry/aedis/ui/badge";
import { CodeBlock } from "@/registry/aedis/ui/code-block";
import { Kbd } from "@/registry/aedis/ui/kbd";

export const dynamicParams = false;

export function generateStaticParams() {
  return components.map((c) => ({ name: c.name }));
}

export async function generateMetadata({ params }: { params: Promise<{ name: string }> }): Promise<Metadata> {
  const { name } = await params;
  const doc = components.find((c) => c.name === name);
  return { title: doc?.title, description: doc?.description };
}

// What `aedis init` already installed: not worth listing as something `add` brings.
const INIT = new Set(["theme", "utils", "untrusted", "api", "security-headers"]);

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 space-y-3">
      <h2 className="text-title-2">{title}</h2>
      {children}
    </section>
  );
}

function PropsTable({ props }: { props: Prop[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-hairline">
      <table className="w-full min-w-[36rem] text-left text-callout">
        <thead className="text-footnote text-muted-foreground">
          <tr><th className="px-3 py-2 font-medium">Prop</th><th className="px-3 py-2 font-medium">Type</th><th className="px-3 py-2 font-medium">Default</th><th className="px-3 py-2 font-medium">Description</th></tr>
        </thead>
        <tbody>
          {props.map((p) => (
            <tr key={p.name} className="border-t border-hairline align-top">
              <td className="px-3 py-2 font-mono text-footnote">{p.name}</td>
              <td className="px-3 py-2 font-mono text-footnote text-muted-foreground">{p.type}</td>
              <td className="px-3 py-2 font-mono text-footnote text-muted-foreground">{p.default ?? "—"}</td>
              <td className="px-3 py-2">{p.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function ComponentPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const doc = components.find((c) => c.name === name);
  if (!doc) notFound();
  const item = registry.items.find((i) => i.name === name);
  const npm = item?.dependencies ?? [];
  const adds = (item?.registryDependencies ?? []).map((d) => d.replace("@aedis/", "")).filter((d) => !INIT.has(d));
  const [main, ...more] = doc.examples ?? [];
  const a11y = doc.accessibility;
  // A row named "SheetContent labels" belongs to SheetContent: one table per part.
  const byPart = new Map<string, Prop[]>([[doc.title.replace(/\s/g, ""), []]]);
  for (const p of doc.props) {
    const [, part, prop] = /^([A-Z]\w+) ([a-z].*)$/.exec(p.name) ?? [];
    const key = part ?? [...byPart.keys()][0];
    byPart.set(key, [...(byPart.get(key) ?? []), part ? { ...p, name: prop } : p]);
  }
  const parts: ApiPart[] = [...[...byPart].filter(([, props]) => props.length).map(([name, props]) => ({ name, props })), ...(doc.parts ?? [])];
  const badges = [
    npm.some((d) => d.startsWith("@base-ui/react@")) && "Base UI",
    a11y?.keyboard?.length && "Keyboard",
    a11y?.motion && "Reduced motion",
  ].filter((b): b is string => Boolean(b));
  const toc = [
    { id: "installation", title: "Installation" },
    { id: "usage", title: "Usage" },
    more.length > 0 && { id: "examples", title: "Examples" },
    { id: "api", title: "API reference" },
    { id: "security", title: "Security" },
    a11y && { id: "accessibility", title: "Accessibility and motion" },
  ].filter((t): t is { id: string; title: string } => Boolean(t));

  return (
    <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_11rem]">
      <article className="min-w-0 space-y-10">
        <header className="space-y-3">
          <p className="text-footnote text-muted-foreground">Components › {doc.category}</p>
          <h1 className="text-title-1">{doc.title}</h1>
          <p className="text-body text-muted-foreground">{doc.description}</p>
          {badges.length > 0 ? <div className="flex flex-wrap gap-1.5">{badges.map((b) => <Badge key={b} variant="secondary">{b}</Badge>)}</div> : null}
        </header>

        {main ? <ComponentPreview file={main.file} component={main.component} label={`${doc.title} example`} /> : null}

        <Section id="installation" title="Installation">
          <InstallCommand name={doc.name} />
          <p className="text-callout text-muted-foreground">
            The CLI checks the Sigstore signature and build provenance of the registry release before it writes any file
            {npm.length > 0 ? <>, and pins {npm.map((d, i) => <span key={d}>{i > 0 ? ", " : ""}<code className="font-mono">{d.replace(/@[^@]+$/, "")}</code></span>)} to an exact version at least 7 days old</> : null}.
            {adds.length > 0 ? <> It also adds {adds.map((d, i) => <span key={d}>{i > 0 ? ", " : ""}<code className="font-mono">{d}</code></span>)}.</> : null}{" "}
            New app? Run <Link href="/docs" className="focus-ring rounded-xs underline underline-offset-4">init</Link> first.
          </p>
        </Section>

        <Section id="usage" title="Usage">
          <CodeBlock lang="tsx" code={doc.usage} />
        </Section>

        {more.length > 0 ? (
          <Section id="examples" title="Examples">
            {more.map((e) => (
              <div key={e.file} className="space-y-3 pt-2">
                <h3 className="text-title-3">{e.title}</h3>
                {e.description ? <p className="text-callout text-muted-foreground">{e.description}</p> : null}
                <ComponentPreview file={e.file} component={e.component} label={`${e.title} example`} />
              </div>
            ))}
          </Section>
        ) : null}

        <Section id="api" title="API reference">
          {parts.map((p) => (
            <div key={p.name} className="space-y-2 pt-2">
              {parts.length > 1 ? <h3 className="font-mono text-headline">{p.name}</h3> : null}
              {p.description ? <p className="text-callout text-muted-foreground">{p.description}</p> : null}
              <PropsTable props={p.props} />
            </div>
          ))}
        </Section>

        <Section id="security" title="Security">
          <ul className="list-disc space-y-1 pl-5 text-callout">
            {doc.security.map((s) => <li key={s}>{s}</li>)}
          </ul>
        </Section>

        {a11y ? (
          <Section id="accessibility" title="Accessibility and motion">
            {a11y.keyboard?.length ? (
              <dl className="grid gap-x-6 gap-y-2 text-callout sm:grid-cols-[auto_1fr]">
                {a11y.keyboard.map(([key, action]) => (
                  <div key={key} className="contents">
                    <dt><Kbd>{key}</Kbd></dt>
                    <dd>{action}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            {a11y.notes?.length ? <ul className="list-disc space-y-1 pl-5 text-callout">{a11y.notes.map((n) => <li key={n}>{n}</li>)}</ul> : null}
            {a11y.motion ? <p className="text-callout text-muted-foreground">{a11y.motion}</p> : null}
          </Section>
        ) : null}
      </article>
      <aside className="hidden xl:block">
        <div className="sticky top-20">
          <Toc items={toc} />
        </div>
      </aside>
    </div>
  );
}
