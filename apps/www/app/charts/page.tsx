import type { Metadata } from "next";

import { ChartsGallery } from "@/components/site/charts-gallery";
import { pageMetadata } from "@/content/share";
import { Badge } from "@/registry/aedis/ui/badge";
import { Card } from "@/registry/aedis/ui/card";

export const metadata: Metadata = pageMetadata("/charts");

// The four rules of #112, each proved in test/chart.test.tsx.
const rules = [
  { title: "Labels are text", text: "Series names, ticks and tooltips render as text nodes. A label like <img onerror> shows up as characters." },
  { title: "Numbers are checked", text: "Non-finite or out-of-range values are dropped and counted, never drawn off-canvas." },
  { title: "Colors from tokens", text: "Series colors come from the theme and pass 3:1 against the surface in every theme." },
  { title: "Accessible by default", text: "Each chart has a data table for screen readers and a tooltip reachable by keyboard." },
];

export default function Charts() {
  return (
    <main className="mx-auto max-w-7xl space-y-7 px-4 pt-12 pb-24 md:px-6">
      <header className="enter max-w-3xl space-y-2.5">
        <h1 className="text-display">Charts</h1>
        <p className="text-title-3 font-normal text-muted-foreground">Charts for usage, spend and agent health. Data in, text out: no chart ever renders markup from your data.</p>
      </header>
      <ChartsGallery />
      <Card className="gap-4 p-6">
        <div className="flex items-center gap-2.5">
          <Badge variant="accent">DOM sink</Badge>
          <h2 className="text-headline">How charts stay safe</h2>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {rules.map((r) => (
            <div key={r.title} className="flex flex-col gap-1">
              <h3 className="text-callout font-semibold">{r.title}</h3>
              <p className="text-callout text-muted-foreground">{r.text}</p>
            </div>
          ))}
        </div>
        <a href="https://github.com/aedis-build/aedis-ui/blob/main/apps/www/test/chart.test.tsx" className="focus-ring self-start rounded-xs text-callout text-link underline underline-offset-4">The tests that prove each rule ↗</a>
      </Card>
    </main>
  );
}
