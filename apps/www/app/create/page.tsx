import type { Metadata } from "next";

import { Create } from "@/components/site/create";
import { pageMetadata } from "@/content/share";

export const metadata: Metadata = pageMetadata("/create");

export default function CreatePage() {
  return (
    <main className="mx-auto max-w-7xl space-y-7 px-4 pt-12 pb-24 md:px-6">
      <header className="enter max-w-3xl space-y-2.5">
        <h1 className="text-display">Create</h1>
        <p className="text-title-3 font-normal text-muted-foreground">Start a project with your theme, your blocks and the security level you need. You get one command.</p>
      </header>
      <Create />
    </main>
  );
}
