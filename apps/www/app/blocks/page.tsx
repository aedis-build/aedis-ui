import type { Metadata } from "next";
import Link from "next/link";

import { CLI } from "@/components/site/install-command";
import { blocks } from "@/content/blocks";
import { Badge } from "@/registry/aedis/ui/badge";

export const metadata: Metadata = { title: "Blocks", description: "Whole screens for AI platforms, built only from Aedis UI components and installed with the CLI." };

export default function Blocks() {
  return (
    <main className="mx-auto max-w-6xl space-y-10 px-4 pt-16 pb-24 md:px-6">
      <header className="enter max-w-3xl space-y-3">
        <h1 className="text-display">Blocks</h1>
        <p className="text-title-3 font-normal text-muted-foreground">
          Whole screens for AI platforms, built only from registry items. Each one installs with the CLI and keeps the defenses of everything inside it.
        </p>
      </header>
      <ul className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {blocks.map(({ name, title, description, demo: Demo }) => (
          <li key={name}>
            <Link href={`/blocks/${name}`} className="lift focus-ring flex h-full flex-col overflow-hidden rounded-xl border border-hairline bg-surface shadow-elevation-1">
              {/* A picture of the block: inert, so it is neither focusable nor read twice. */}
              <span inert className="pointer-events-none flex h-72 items-start justify-center overflow-hidden bg-background p-4">
                <span className="w-[200%] shrink-0 origin-top scale-50">
                  <Demo />
                </span>
              </span>
              <span className="flex flex-col items-start gap-1.5 p-5">
                <span className="text-title-3">{title}</span>
                <span className="text-callout text-muted-foreground">{description}</span>
                <Badge variant="secondary">npx {CLI} add {name}</Badge>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
