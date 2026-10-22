import Link from "next/link";
import type { ComponentType } from "react";

import { CLI } from "@/components/site/install-command";
import { Gallery } from "@/components/site/gallery";
import { categories, components } from "@/content/components";
import registry from "@/registry.json";
import { Badge } from "@/registry/aedis/ui/badge";
import { Button } from "@/registry/aedis/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/registry/aedis/ui/card";
import { CodeBlock } from "@/registry/aedis/ui/code-block";

const ui = new Set(registry.items.filter((i) => i.type === "registry:ui").map((i) => i.name));
const tiles = components.filter((c) => ui.has(c.name) && c.examples?.length).sort((a, b) => a.title.localeCompare(b.title));

const sinks = [
  { tag: "DOM", title: "What is shown", text: "Content comes in as props and renders as data. No prop takes markup; links pass through safeUrl." },
  { tag: "Input", title: "What people type", text: "Fields are bounded by default and hidden code points are stripped before anything reaches an agent." },
  { tag: "Transport", title: "What goes to the backend", text: "Same-origin only, no redirects, a CSRF header, JSON only and a timeout on every call." },
  { tag: "Session", title: "What the browser keeps", text: "Nothing readable by script: HttpOnly cookie, idle timeout and opener isolation." },
];

function Preview({ component: Example }: { component: ComponentType }) {
  return <Example />;
}

export default function Home() {
  return (
    <main className="mx-auto max-w-7xl px-4 md:px-6">
      <section className="enter flex flex-col items-center gap-5 pt-20 pb-12 text-center">
        <Badge variant="secondary">{ui.size} components · Base UI · Apache-2.0</Badge>
        <h1 className="max-w-[16em] text-display">Components for AI platforms, secure by default.</h1>
        <p className="max-w-2xl text-title-3 font-normal text-muted-foreground">
          Copy them into your app and own the code. Every component defends the sink it touches, every release is signed, and the CLI verifies it
          before writing a single file.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button size="lg" render={<Link href="/docs" />}>Get started</Button>
          <Button size="lg" variant="outline" render={<Link href="#components" />}>Browse components</Button>
        </div>
        <CodeBlock lang="bash" className="terminal w-full max-w-md text-left" code={`npx ${CLI} add dropdown-menu`} />
      </section>

      <section aria-label="What every component defends" className="grid gap-4 pb-14 sm:grid-cols-2 lg:grid-cols-4">
        {sinks.map((s) => (
          <Card key={s.tag}>
            <CardHeader>
              <span className="text-caption font-medium text-link">{s.tag}</span>
              <CardTitle>{s.title}</CardTitle>
              <CardDescription>{s.text}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section id="components" className="scroll-mt-20 space-y-6 pb-24">
        <h2 className="text-title-1">Every component, live</h2>
        <Gallery
          categories={categories.filter((c) => tiles.some((t) => t.category === c))}
          items={tiles.map((c) => ({ name: c.name, title: c.title, category: c.category, preview: <Preview component={c.examples![0].component} /> }))}
        />
      </section>
    </main>
  );
}
