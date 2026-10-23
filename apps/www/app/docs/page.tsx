import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { CLI, InstallCommand, RegistrySetup, ThemeImport } from "@/components/site/install-command";
import { Toc } from "@/components/site/toc";
import registry from "@/registry.json";
import { Card, CardDescription, CardTitle } from "@/registry/aedis/ui/card";
import { CodeBlock } from "@/registry/aedis/ui/code-block";

export const metadata: Metadata = { title: "Introduction", description: "What Aedis UI is and where to start." };

const link = "focus-ring rounded-xs underline underline-offset-4";
const count = registry.items.filter((i) => ["registry:ui", "registry:hook"].includes(i.type)).length;

const start = [
  { href: "#installation", title: "Installation", text: "Init once, then add components with the CLI that checks every release." },
  { href: "/components", title: "Components", text: `${count} components and hooks, each with the sink it defends.` },
  { href: "/blocks", title: "Blocks", text: "Whole screens for AI platforms, ready to copy." },
  { href: "/charts", title: "Charts", text: "Data in, text out: charts that never render markup." },
  { href: "/security", title: "Security", text: "Four sinks, the attack table and the app checklist." },
  { href: "/micro-frontends", title: "Micro-frontends", text: "iframe, Web Component or Multi-Zones, by trust level." },
  { href: "/themes", title: "Themes", text: "Make it yours without editing a component." },
  { href: "#for-agents", title: "For agents", text: "llms.txt and an MCP server with the rules." },
];

/** What a project gets from Aedis UI, each with the page that shows it. */
const gets: [title: string, text: string, href: string][] = [
  ["Code you own, verified", "The CLI copies the source into your app, after checking the release was signed and built by this repository.", "#installation"],
  ["Security per sink, with tests", "Each component defends what it touches (DOM, Input, Transport, Session), and a test proves each defense.", "/security"],
  ["AI and agent components", "Chat, approvals, hand raises, tool calls, streaming answers, usage and charts.", "/components"],
  ["Micro-frontends", "mf-frame, mf-bridge and mf-element, and a guide to Multi-Zones on one site.", "/micro-frontends"],
  ["Docs for coding agents", "llms.txt and an MCP server that return each item's API and security rules.", "#for-agents"],
];

const toc = [
  { id: "introduction", title: "Introduction" },
  { id: "where-to-start", title: "Where to start" },
  { id: "installation", title: "Installation" },
  { id: "what-you-get", title: "What you get" },
  { id: "for-agents", title: "For coding agents" },
];

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 space-y-3">
      <h2 className="text-title-2">{title}</h2>
      {children}
    </section>
  );
}

export default function Introduction() {
  return (
    <div className="grid grid-cols-1 gap-10 xl:grid-cols-[minmax(0,1fr)_11rem]">
      <article className="max-w-3xl space-y-10">
        <header id="introduction" className="scroll-mt-20 space-y-3">
          <p className="text-footnote text-muted-foreground">Docs · Getting started</p>
          <h1 className="text-display">Introduction</h1>
          <p className="text-title-3 font-normal text-muted-foreground">
            Aedis UI is how you build the interface of an AI platform you can defend. It is not a dependency: the CLI copies the code into your
            app, after checking the release was signed and built where it says.
          </p>
        </header>

        <Section id="where-to-start" title="Where to start">
          <ul className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {start.map((s) => (
              <li key={s.title}>
                <Link href={s.href} className="lift focus-ring block h-full rounded-md">
                  <Card className="h-full gap-1.5 p-4.5">
                    <CardTitle>{s.title} →</CardTitle>
                    <CardDescription>{s.text}</CardDescription>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="installation" title="Installation">
          <p className="text-callout text-muted-foreground">
            Once per app, run <code className="font-mono">init</code>. It writes <code className="font-mono">aedis.json</code> (the pinned release and where files go),
            the theme, <code className="font-mono">cn</code> and the security primitives. The CLI verifies the signed registry release before writing any
            file, installs npm dependencies at exact versions at least 7 days old and runs no install scripts.
          </p>
          <RegistrySetup />
          <p className="text-callout text-muted-foreground">Import the theme once in your global CSS, after Tailwind:</p>
          <ThemeImport />
          <p className="text-callout text-muted-foreground">Then add components; their registry dependencies come with them:</p>
          <InstallCommand name="button" />
          <p className="text-callout text-muted-foreground">
            Never run <code className="font-mono">npx aedis</code>: the unscoped package belongs to someone else. The CLI is{" "}
            <code className="font-mono">{CLI.replace(/@[\d.]+$/, "")}</code>.
          </p>
        </Section>

        <Section id="what-you-get" title="What you get">
          <ul className="m-0 flex list-none flex-col divide-y divide-hairline rounded-lg border border-hairline bg-surface p-0">
            {gets.map(([title, text, href]) => (
              <li key={title} className="flex flex-col gap-0.5 px-4 py-3">
                <Link href={href} className="focus-ring self-start rounded-xs text-callout font-semibold hover:underline">{title}</Link>
                <span className="text-callout text-muted-foreground">{text}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="for-agents" title="For coding agents">
          <p className="text-callout text-muted-foreground">
            Agents read the same docs, with the rules that matter for each item: <a href="/llms.txt" className={link}>llms.txt</a> indexes everything and{" "}
            <a href="/llms-full.txt" className={link}>llms-full.txt</a> has every entry in full. A read-only docs server speaks the Model Context Protocol
            on stdio: it lists and searches items, returns one with its API and security rules, and gives its install command.
          </p>
          <CodeBlock lang="json" title=".mcp.json" code={JSON.stringify({ mcpServers: { "aedis-ui": { command: "npx", args: ["-y", CLI, "mcp"] } } }, null, 2)} />
        </Section>
      </article>
      <aside className="hidden xl:block">
        <div className="sticky top-20">
          <Toc items={toc} />
        </div>
      </aside>
    </div>
  );
}
