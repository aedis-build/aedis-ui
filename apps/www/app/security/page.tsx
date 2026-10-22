import type { Metadata } from "next";

import { InlineMarkdown } from "@/components/site/inline-markdown";
import { CLI } from "@/components/site/install-command";
import { securityDoc, type Status } from "@/components/site/security-doc";
import { Badge } from "@/registry/aedis/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/registry/aedis/ui/card";
import { Checkbox } from "@/registry/aedis/ui/checkbox";
import { CodeBlock } from "@/registry/aedis/ui/code-block";
import { Label } from "@/registry/aedis/ui/label";

export const metadata: Metadata = {
  title: "Security by construction",
  description: "How Aedis UI treats each class of attack a browser application faces, and what it leaves to the backend.",
};

const status: Record<Status, string> = {
  structural: "bg-success/12 text-success",
  default: "bg-accent-soft text-foreground",
  process: "bg-muted text-foreground",
  boundary: "bg-warning/12 text-warning",
};

const th = "px-4 py-3 text-footnote font-medium text-muted-foreground";

export default function Security() {
  const doc = securityDoc();
  const supply = doc.attacks.find((a) => a.attack.includes("Supply chain"));
  return (
    <main className="mx-auto max-w-6xl space-y-14 px-4 pt-16 pb-24 md:px-6">
      <section className="enter max-w-3xl space-y-4">
        <Badge className="bg-success/12 text-success">L3 Regulated · OWASP · MITRE ATT&amp;CK and ATLAS</Badge>
        <h1 className="text-display">Security by construction</h1>
        <p className="text-title-3 font-normal text-muted-foreground"><InlineMarkdown text={doc.principle[0].replace(/:$/, ".")} /></p>
        <p className="text-callout text-muted-foreground"><InlineMarkdown text={doc.intro.join(" ")} /></p>
      </section>

      <section aria-label="Sinks" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {doc.sinks.map((s) => (
          <Card key={s.sink} className="shadow-elevation-2">
            <CardHeader>
              <span className="text-caption text-muted-foreground [&_strong]:text-link"><InlineMarkdown text={s.sink} /></span>
              <CardTitle className="text-headline"><InlineMarkdown text={s.defense} /></CardTitle>
            </CardHeader>
            <CardContent className="text-footnote text-muted-foreground"><InlineMarkdown text={s.where} /></CardContent>
          </Card>
        ))}
      </section>
      {doc.principle.slice(1).map((p) => <p key={p} className="max-w-3xl text-callout text-muted-foreground"><InlineMarkdown text={p} /></p>)}

      <section className="space-y-4">
        <h2 className="text-title-1">How each attack is treated</h2>
        <div className="overflow-x-auto rounded-xl border border-hairline bg-surface shadow-elevation-1">
          <table className="w-full min-w-[48rem] text-left text-callout">
            <thead>
              <tr><th className={th}>Attack</th><th className={th}>Resolved at</th><th className={th}>How</th><th className={th}>Status</th></tr>
            </thead>
            <tbody>
              {doc.attacks.map((a) => (
                <tr key={a.attack} className="border-t border-hairline align-top">
                  <td className="px-4 py-3 font-medium"><InlineMarkdown text={a.attack} /></td>
                  <td className="px-4 py-3 text-muted-foreground">{a.at}</td>
                  <td className="px-4 py-3"><InlineMarkdown text={a.how} /></td>
                  <td className="px-4 py-3">
                    <Badge className={status[a.status]}>{a.status[0].toUpperCase() + a.status.slice(1)}</Badge>
                    {a.note ? <p className="mt-1 text-footnote text-muted-foreground">{a.note}</p> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid items-start gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-title-2">Supply chain you can check</h2>
          {supply ? <p className="text-callout text-muted-foreground"><InlineMarkdown text={supply.how} /></p> : null}
          <CodeBlock lang="bash" className="terminal" code={`$ npx ${CLI} add dropdown-menu\nverifying v0.1.0…\nfrom aedis-build/aedis-ui v0.1.0 (verified):`} />
          <p className="text-footnote text-muted-foreground">The first lines of a run. The CLI then lists the files it would write and the exact npm versions, and asks before writing.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-title-2">Checklist for your app</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {doc.checklist.map((c, i) => (
                <li key={c} className="flex items-start gap-3">
                  <Checkbox id={`check-${i}`} className="mt-0.5" />
                  <Label htmlFor={`check-${i}`} className="block font-normal leading-normal"><InlineMarkdown text={c} /></Label>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-title-2">MITRE ATT&amp;CK and ATLAS coverage</h2>
        <div className="overflow-x-auto rounded-xl border border-hairline bg-surface">
          <table className="w-full min-w-[40rem] text-left text-callout">
            <thead><tr><th className={th}>Technique</th><th className={th}>Treatment in Aedis UI</th></tr></thead>
            <tbody>
              {doc.mitre.map((m) => (
                <tr key={m.technique} className="border-t border-hairline align-top">
                  <td className="px-4 py-3"><InlineMarkdown text={m.technique} /></td>
                  <td className="px-4 py-3 text-muted-foreground"><InlineMarkdown text={m.treatment} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl bg-foreground p-8 text-background shadow-elevation-2 [&_a]:text-background [&_a]:underline">
        <h2 className="text-title-2">What the UI cannot do</h2>
        {doc.cannot.map((p) => <p key={p} className="text-body opacity-85"><InlineMarkdown text={p} /></p>)}
      </section>

      <section className="space-y-4">
        <h2 className="text-title-2">L3 Regulated in this repository</h2>
        <div className="overflow-x-auto rounded-xl border border-hairline bg-surface">
          <table className="w-full min-w-[40rem] text-left text-callout">
            <thead><tr><th className={th}>Requirement</th><th className={th}>How it is met</th></tr></thead>
            <tbody>
              {doc.l3.map((r) => (
                <tr key={r.requirement} className="border-t border-hairline align-top">
                  <td className="px-4 py-3 font-medium"><InlineMarkdown text={r.requirement} /></td>
                  <td className="px-4 py-3 text-muted-foreground"><InlineMarkdown text={r.how} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
