import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/site/json-ld";
import { MfDemoShell } from "@/components/site/mf-demo-shell";
import { ShellDiagram } from "@/components/site/shell-diagram";
import { FramePanel } from "@/components/site/showcase";
import { approaches, defends, verdicts } from "@/content/micro-frontends";
import { pageMetadata } from "@/content/share";
import { Badge } from "@/registry/aedis/ui/badge";
import { Button } from "@/registry/aedis/ui/button";
import { Card } from "@/registry/aedis/ui/card";
import { CodeBlock } from "@/registry/aedis/ui/code-block";

export const metadata: Metadata = pageMetadata("/micro-frontends");

const repo = "https://github.com/aedis-build/aedis-ui/blob/main/apps/www/test";

const usage = `import { MfFrame, useReportHeight } from "@/components/ui/mf-frame";

// In the shell: the panel keeps its own origin.
<MfFrame src="https://billing.example/panel" title="Billing" maxHeight={900} />

// In the billing app: report the height, nothing else.
useReportHeight(["https://app.example"]);`;

export default function MicroFrontends() {
  return (
    <main id="main" className="mx-auto max-w-7xl space-y-14 px-4 pt-14 pb-24 md:px-6">
      <JsonLd path="/micro-frontends" />
      <section className="enter grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <span className="text-caption font-semibold uppercase tracking-wide text-link">Micro-frontends</span>
          <h1 className="text-display">Micro-frontends without giving up the CSP.</h1>
          <p className="text-title-3 font-normal text-muted-foreground">
            Pick the boundary by how much two apps trust each other, not by how the code is split. The kit gives you the safe default for each.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" render={<Link href="/docs/micro-frontends" />}>Read the guide</Button>
            <Button size="lg" variant="secondary" render={<Link href="/docs/mf-frame" />}>See mf-frame</Button>
          </div>
        </div>
        <Card className="p-5">
          <ShellDiagram />
        </Card>
      </section>

      <section aria-labelledby="live-demo" className="space-y-3.5">
        <div className="max-w-3xl space-y-1.5">
          <h2 id="live-demo" className="text-title-2">Watch it work</h2>
          <p className="text-callout text-muted-foreground">
            A shell and a billing remote, live on this page. The remote is a page of this site in an <code className="font-mono">MfFrame</code>, sandboxed, so its
            origin is opaque; everything it says crosses <code className="font-mono">mf-bridge</code>, and the log shows what the bridge lets through and what it drops.
          </p>
        </div>
        <MfDemoShell />
      </section>

      <section className="space-y-3.5">
        <h2 className="text-title-2">Choosing an approach</h2>
        <div className="overflow-x-auto rounded-lg border border-hairline bg-surface">
          <table className="w-full min-w-[46rem] text-left text-callout">
            <thead className="text-footnote text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Approach</th>
                <th className="px-3 py-2 font-medium">Use it for</th>
                <th className="px-3 py-2 font-medium">Security boundary</th>
                <th className="px-3 py-2 font-medium">Verdict</th>
              </tr>
            </thead>
            <tbody>
              {approaches.map(([name, use, boundary], i) => (
                <tr key={name} className="border-t border-hairline align-top">
                  <th scope="row" className="px-3 py-2.5 font-semibold">{name}</th>
                  <td className="px-3 py-2.5">{use}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{boundary}</td>
                  <td className="px-3 py-2.5">
                    <Badge variant={i === 0 ? "accent" : i === 3 ? "destructive" : "secondary"}>{verdicts[i]}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-footnote text-muted-foreground">
          From the guide, which also covers <Link href="/docs/micro-frontends" className="focus-ring rounded-xs text-link underline underline-offset-4">Multi-Zones on the same site and embeds on another origin</Link>.
        </p>
      </section>

      <section className="space-y-3.5">
        <h2 className="text-title-2">What the kit defends</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {defends.map((d) => (
            <Card key={d.title} className="gap-2 p-5">
              <h3 className="text-headline">{d.title}</h3>
              <p className="text-callout text-muted-foreground">{d.text}</p>
              <p className="mt-auto text-caption text-muted-foreground">
                Test: <a href={`${repo}/${d.proof[0]}`} className="focus-ring rounded-xs text-link underline underline-offset-4">{d.proof[0]} ↗</a> › {d.proof[1]}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="min-w-0 space-y-3">
          <h2 className="text-title-2">Embed another team&apos;s panel</h2>
          <p className="text-callout text-muted-foreground">
            The shell owns the session and the header. The panel lives on its own origin and talks only through the bridge. The props are on the{" "}
            <Link href="/docs/mf-frame" className="focus-ring rounded-xs text-link underline underline-offset-4">mf-frame page</Link>.
          </p>
          <CodeBlock lang="tsx" code={usage} />
        </div>
        <FramePanel />
      </section>
    </main>
  );
}
