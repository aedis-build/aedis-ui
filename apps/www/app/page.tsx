import Link from "next/link";

import { Button } from "@/registry/aedis/ui/button";

export default function Home() {
  return (
    <section className="space-y-6">
      <h1 className="text-display">Components for AI platforms, secure by default.</h1>
      <p className="max-w-2xl text-title-3 font-normal text-muted-foreground">
        Agent chat, approvals, hand raises, usage ceilings and workflow editors. Copy them into your app with the Aedis CLI, which
        verifies every release, and own the code. Agent output is always treated as data, and anything that leaves the company asks for confirmation.
      </p>
      <div className="flex gap-3">
        <Button render={<Link href="/docs/button" />}>
          Browse components
        </Button>
        <Button variant="outline" render={<a href="https://github.com/aedis-build/aedis-ui" rel="noopener noreferrer" />}>
          GitHub
        </Button>
      </div>
    </section>
  );
}
