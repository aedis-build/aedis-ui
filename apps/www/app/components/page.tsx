import type { Metadata } from "next";
import type { ComponentType } from "react";

import { DocsShell } from "@/components/site/docs-shell";
import { Gallery } from "@/components/site/gallery";
import { categories, components } from "@/content/components";
import registry from "@/registry.json";

export const metadata: Metadata = { title: "Components", description: "Every Aedis UI component, live, by category." };

const ui = new Set(registry.items.filter((i) => i.type === "registry:ui").map((i) => i.name));
const tiles = components.filter((c) => ui.has(c.name) && c.examples?.length).sort((a, b) => a.title.localeCompare(b.title));

function Preview({ component: Example }: { component: ComponentType }) {
  return <Example />;
}

export default function Components() {
  return (
    <DocsShell>
      <div className="space-y-6 pb-16">
        <div className="space-y-2">
          <h1 className="text-display">Components</h1>
          <p className="text-title-3 font-normal text-muted-foreground">{tiles.length} components, each a live preview. Open one for its code, API and security panel.</p>
        </div>
        <Gallery
          categories={categories.filter((c) => tiles.some((t) => t.category === c))}
          items={tiles.map((c) => ({ name: c.name, title: c.title, category: c.category, preview: <Preview component={c.examples![0].component} /> }))}
        />
      </div>
    </DocsShell>
  );
}
