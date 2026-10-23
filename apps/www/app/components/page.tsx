import type { Metadata } from "next";
import type { ComponentType } from "react";

import { Gallery } from "@/components/site/gallery";
import { categories, components } from "@/content/components";
import registry from "@/registry.json";

export const metadata: Metadata = { title: "Components", description: "Every Aedis UI component and hook, live, by category, with the sink it defends." };

// Every registry item with a docs entry; blocks have their own page.
const items = new Set(registry.items.filter((i) => i.type !== "registry:block").map((i) => i.name));
const docs = components.filter((c) => items.has(c.name)).sort((a, b) => a.title.localeCompare(b.title));
// The board's order: what you build screens from first, the foundations and security primitives after.
const order = ["Actions", "Forms", "Overlays", "Navigation", "Feedback", "Data display", "Charts", "AI and agents", "Micro-frontends", "Foundations", "Security", "Transport"];
const shown = [...categories].sort((a, b) => order.indexOf(a) - order.indexOf(b)).filter((c) => docs.some((d) => d.category === c));

function Preview({ component: Example }: { component: ComponentType }) {
  return <Example />;
}

export default function Components() {
  return (
    <main className="mx-auto max-w-7xl space-y-9 px-4 pt-12 pb-24 md:px-6">
      <header className="enter max-w-3xl space-y-2.5">
        <h1 className="text-display">Components</h1>
        <p className="text-title-3 font-normal text-muted-foreground">
          {docs.length} components and hooks. Every card is the real component, live, with the sink it defends.
        </p>
      </header>
      <Gallery
        categories={shown}
        items={docs.map((c) => ({
          name: c.name,
          title: c.title,
          description: c.description,
          category: c.category,
          sinks: c.security.sinks,
          preview: c.examples?.length ? <Preview component={c.examples[0].component} /> : undefined,
        }))}
      />
    </main>
  );
}
