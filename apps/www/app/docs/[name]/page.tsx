import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { InstallCommand, RegistrySetup } from "@/components/site/install-command";
import { components } from "@/content/components";

export const dynamicParams = false;

export function generateStaticParams() {
  return components.map((c) => ({ name: c.name }));
}

export async function generateMetadata({ params }: { params: Promise<{ name: string }> }): Promise<Metadata> {
  const { name } = await params;
  const doc = components.find((c) => c.name === name);
  return { title: doc?.title, description: doc?.description };
}

export default async function ComponentPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const doc = components.find((c) => c.name === name);
  if (!doc) notFound();

  return (
    <article className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">{doc.title}</h1>
        <p className="text-muted-foreground">{doc.description}</p>
      </header>

      <section aria-label="Example" className="rounded-md border border-border p-8">{doc.example}</section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Installation</h2>
        <p className="text-sm text-muted-foreground">Once per app, add the Aedis registry to <code>components.json</code>:</p>
        <RegistrySetup />
        <p className="text-sm text-muted-foreground">Then add the component:</p>
        <InstallCommand name={doc.name} />
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Props</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-muted-foreground">
              <tr><th className="py-2 pr-4">Prop</th><th className="py-2 pr-4">Type</th><th className="py-2 pr-4">Default</th><th className="py-2">Description</th></tr>
            </thead>
            <tbody>
              {doc.props.map((p) => (
                <tr key={p.name} className="border-t border-border align-top">
                  <td className="py-2 pr-4 font-mono">{p.name}</td>
                  <td className="py-2 pr-4 font-mono text-xs">{p.type}</td>
                  <td className="py-2 pr-4 font-mono text-xs">{p.default ?? "—"}</td>
                  <td className="py-2">{p.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Security</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {doc.security.map((s) => <li key={s}>{s}</li>)}
        </ul>
      </section>
    </article>
  );
}
