import Link from "next/link";

import { CLI } from "@/components/site/install-command";
import { Showcase } from "@/components/site/showcase";
import { Badge } from "@/registry/aedis/ui/badge";
import { Button } from "@/registry/aedis/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/registry/aedis/ui/card";
import { CodeBlock } from "@/registry/aedis/ui/code-block";

const sinks = [
  { tag: "DOM", title: "What is shown", text: "Props render as data. No prop takes markup; links pass through safeUrl." },
  { tag: "Input", title: "What people type", text: "Bounded by default; hidden code points stripped before an agent sees them." },
  { tag: "Transport", title: "What goes to the backend", text: "Same-origin, no redirects, a CSRF header and a timeout on every call." },
  { tag: "Session", title: "What the browser keeps", text: "Nothing readable by script: HttpOnly cookie, idle timeout, opener isolation." },
];

// Plain wordmarks as text: no third-party logo files.
const builtOn = ["React", "Base UI", "Tailwind CSS", "Next.js", "Sigstore", "OpenSSF Scorecard"];

function Eyebrow({ children }: { children: string }) {
  return <span className="text-caption font-semibold uppercase tracking-wide text-link">{children}</span>;
}

function More({ href, children }: { href: string; children: string }) {
  return <Link href={href} className="focus-ring self-start rounded-xs text-callout font-medium text-link underline-offset-4 hover:underline">{children}</Link>;
}

/** The shell/remotes diagram: one shell, a framed remote, an element and a zone. Text in the SVG is text. */
function ShellDiagram() {
  const box = { fill: "var(--surface)", stroke: "var(--border)" };
  return (
    <svg viewBox="0 0 460 200" role="img" aria-label="A shell holding a framed billing app, an agents element and a docs zone" className="w-full">
      <rect x="1" y="1" width="458" height="198" rx="16" fill="var(--background)" stroke="var(--border)" />
      <rect x="1" y="1" width="458" height="34" rx="16" {...box} />
      <text x="16" y="23" fontSize="12" fontWeight="700" fill="var(--foreground)">Shell · session, header, CSP</text>
      <text x="444" y="23" fontSize="11" fill="var(--muted-foreground)" textAnchor="end">app.example</text>
      <rect x="16" y="50" width="206" height="132" rx="12" fill="var(--surface)" stroke="var(--primary)" strokeDasharray="4 3" />
      <text x="28" y="72" fontSize="12" fontWeight="600" fill="var(--foreground)">Billing · mf-frame</text>
      <text x="28" y="90" fontSize="11" fill="var(--muted-foreground)">billing.example, sandboxed</text>
      <rect x="28" y="104" width="182" height="8" rx="4" fill="var(--muted)" />
      <rect x="28" y="120" width="103" height="8" rx="4" fill="var(--muted)" />
      <text x="28" y="168" fontSize="10" fill="var(--link)">⇄ mf-bridge: typed, origin-checked</text>
      <rect x="238" y="50" width="206" height="60" rx="12" {...box} />
      <text x="250" y="74" fontSize="12" fontWeight="600" fill="var(--foreground)">Agents · mf-element</text>
      <text x="250" y="92" fontSize="11" fill="var(--muted-foreground)">same origin, Shadow DOM</text>
      <rect x="238" y="122" width="206" height="60" rx="12" {...box} />
      <text x="250" y="146" fontSize="12" fontWeight="600" fill="var(--foreground)">/docs · Multi-Zone</text>
      <text x="250" y="164" fontSize="11" fill="var(--muted-foreground)">own app, own CSP, one origin</text>
    </svg>
  );
}

export default function Home() {
  return (
    <main>
      <section className="enter mx-auto flex max-w-7xl flex-col items-center gap-5 px-4 pt-16 pb-10 text-center md:px-6 md:pt-20">
        <Link href="/blocks" className="focus-ring rounded-full">
          <Badge variant="outline">New: Charts, Blocks and the micro-frontend kit →</Badge>
        </Link>
        <h1 className="max-w-[16em] text-display">Components for AI platforms, secure by default.</h1>
        <p className="max-w-2xl text-title-3 font-normal text-muted-foreground">
          Copy them into your app and own the code. Every component defends the sink it touches, every release is signed, and the CLI verifies it
          before writing a single file.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button size="lg" render={<Link href="/docs" />}>Get started</Button>
          <Button size="lg" variant="secondary" render={<Link href="/components" />}>Browse components</Button>
        </div>
        <CodeBlock lang="bash" className="terminal w-full max-w-md text-left" code={`npx ${CLI} add approval-card`} />
      </section>

      <Showcase />

      <section aria-label="Built on" className="mx-auto flex max-w-7xl flex-wrap justify-center gap-x-11 gap-y-3 px-4 pb-14 md:px-6">
        {builtOn.map((name) => <span key={name} className="text-headline text-muted-foreground">{name}</span>)}
      </section>

      <section className="mx-auto max-w-7xl space-y-5 px-4 pb-16 md:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <Eyebrow>What shadcn does not give you</Eyebrow>
            <h2 className="text-title-1">Secure by construction</h2>
          </div>
          <More href="/security">How each attack is treated →</More>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {sinks.map((s) => (
            <Card key={s.tag}>
              <CardHeader>
                <Eyebrow>{s.tag}</Eyebrow>
                <CardTitle>{s.title}</CardTitle>
                <CardDescription>{s.text}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 pb-20 md:px-6 lg:grid-cols-[1.1fr_1fr]">
        <Card className="gap-3.5 p-7">
          <Eyebrow>Micro-frontends</Eyebrow>
          <h2 className="text-title-2">One product, many teams, one CSP.</h2>
          <p className="text-callout text-muted-foreground">
            Pick the boundary by how much two apps trust each other: an iframe with a typed bridge, a Web Component, or Multi-Zones on one origin.
          </p>
          <ShellDiagram />
          <More href="/docs/micro-frontends">Choose an approach →</More>
        </Card>
        <Card className="gap-3.5 p-7">
          <Eyebrow>For coding agents</Eyebrow>
          <h2 className="text-title-2">Docs your agent can read.</h2>
          <p className="text-callout text-muted-foreground">
            llms.txt and a read-only MCP server give agents the API, the security rules and the pinned install command, so they stop guessing.
          </p>
          <CodeBlock lang="bash" className="terminal" code={`npx ${CLI} mcp\n# tools: list_components · search_components · get_component · get_install_command`} />
          <More href="/llms.txt">Read llms.txt →</More>
        </Card>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-wrap justify-between gap-3 px-4 pt-6 pb-14 text-footnote text-muted-foreground md:px-6">
        <span>
          Aedis UI · Apache-2.0 · part of <a href="https://aedis.build" className="focus-ring rounded-xs text-link underline-offset-4 hover:underline">aedis.build</a>
        </span>
        <span>Built with Aedis UI, Base UI and Tailwind CSS. Releases signed with Sigstore.</span>
      </footer>
    </main>
  );
}
