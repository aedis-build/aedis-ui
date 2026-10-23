import type { Metadata } from "next";

import { DirectoryTable } from "@/components/site/directory-table";
import { CLI } from "@/components/site/install-command";
import { directory } from "@/content/directory";
import { Card } from "@/registry/aedis/ui/card";
import { CodeBlock } from "@/registry/aedis/ui/code-block";

export const metadata: Metadata = { title: "Directory", description: "Registries you can add with the Aedis CLI, each checked the same way as Aedis UI." };

const requirements = [
  ["Signed release", "The registry archive (<repo>-registry-<tag>.tgz) is signed with Sigstore, keyless, by the repository's own .github/workflows/release.yml."],
  ["Build provenance", "SLSA provenance names that archive, that repository, that workflow and the tag; the CLI checks it before writing a file."],
  ["Aedis lint", "Items pass aedis lint: no markup sinks, bounded text fields, transport through api(). Exemptions carry their reason in registry.json."],
  ["Pinned dependencies", "npm dependencies resolve to exact versions at least 7 days old, installed without scripts, like Aedis UI's own."],
];

// The CLI's own lines for `add button` (packages/cli/src/cli.ts); the npm line lists the versions it picks.
const output = `$ npx ${CLI} add button
verifying v0.1.0…
from aedis-build/aedis-ui v0.1.0 (verified):
  create    components/ui/button.tsx
npm dependencies (exact, at least 7 days old): …
Write these files? y
added button`;

export default function Directory() {
  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 pt-12 pb-24 md:px-6">
      <header className="enter max-w-3xl space-y-2.5">
        <h1 className="text-display">Directory</h1>
        <p className="text-title-3 font-normal text-muted-foreground">
          Registries you can add with the Aedis CLI. Each one is checked the same way as Aedis UI before a single file is written.
        </p>
      </header>
      <DirectoryTable entries={directory} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="gap-4 p-6">
          <h2 className="text-title-2">List your registry</h2>
          <p className="text-callout text-muted-foreground">What a registry needs before the Directory marks it installable. Then open a pull request that adds it to the directory&apos;s data file.</p>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {requirements.map(([title, text]) => (
              <li key={title} className="flex items-start gap-2.5">
                <svg viewBox="0 0 16 16" aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3.5 8.5l3 3 6-7" />
                </svg>
                <span className="flex flex-col">
                  <span className="text-callout font-semibold">{title}</span>
                  <span className="text-callout text-muted-foreground">{text}</span>
                </span>
              </li>
            ))}
          </ul>
          <CodeBlock lang="bash" code={"# in your registry's CI, after building registry.json\nnpx @aedis/cli lint registry.json"} />
        </Card>
        <Card className="gap-4 p-6">
          <h2 className="text-title-2">What the CLI does</h2>
          <p className="text-callout text-muted-foreground">It downloads the release and its attestation, verifies both, and only then shows what it will write.</p>
          <CodeBlock lang="text" className="terminal" code={output} />
          <p className="text-callout text-muted-foreground">A third-party registry is named by its repository and tag, and gets the same checks. Any other registry is refused unless you pass <code className="font-mono">--allow-unverified</code>.</p>
          <CodeBlock lang="bash" code={"npx @aedis/cli add @<owner>/<item> --registry github:<owner>/<repo>@<tag>"} />
          <p className="text-caption text-muted-foreground">
            Third-party registries, <code className="font-mono">--allow-unverified</code> and <code className="font-mono">lint</code> arrive in the CLI release after {CLI.split("@").at(-1)}.
          </p>
        </Card>
      </div>
    </main>
  );
}
