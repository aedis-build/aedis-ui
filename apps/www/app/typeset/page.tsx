import type { Metadata } from "next";

import { Typeset } from "@/components/site/typeset";

export const metadata: Metadata = { title: "Typeset", description: "Set the type for your product and see it on real content." };

export default function TypesetPage() {
  return (
    <main className="mx-auto max-w-7xl space-y-7 px-4 pt-12 pb-24 md:px-6">
      <header className="enter max-w-3xl space-y-2.5">
        <h1 className="text-display">Typeset</h1>
        <p className="text-title-3 font-normal text-muted-foreground">
          Set the type for your product and see it on real content. Long text from people and agents always goes through Markdown, never raw HTML.
        </p>
      </header>
      <Typeset />
    </main>
  );
}
