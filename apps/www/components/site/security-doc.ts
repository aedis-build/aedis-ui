import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";

/** docs/SECURITY-BY-CONSTRUCTION.md at the repository root: the Security page renders from it, so the two never drift. */
export const SECURITY_DOC = join(process.cwd(), "..", "..", "docs", "SECURITY-BY-CONSTRUCTION.md");

export type Status = "structural" | "default" | "process" | "boundary";

/** The rows of the first table after `heading`, without the header row. */
function table(section: string): string[][] {
  return section
    .split("\n")
    .filter((l) => l.startsWith("|"))
    .slice(2)
    .map((l) => l.slice(1, -1).split(" | ").map((c) => c.trim()));
}

function section(md: string, heading: string): string {
  const start = md.indexOf(`\n${heading}\n`);
  if (start === -1) throw new Error(`SECURITY-BY-CONSTRUCTION.md has no "${heading}" section`);
  const rest = md.slice(start + heading.length + 2);
  const end = rest.search(/\n#{2,3} /);
  return end === -1 ? rest : rest.slice(0, end);
}

const paragraphs = (text: string) => text.split(/\n\n+/).map((p) => p.replace(/\n/g, " ").trim()).filter((p) => p && !p.startsWith("|") && !p.startsWith("-"));

/** Reads the document into the parts the Security page shows. Throws when the structure changes, so the build fails. */
export function securityDoc(md = readFileSync(SECURITY_DOC, "utf8")) {
  const principle = section(md, "## Principle: defense at the sink, never a string filter");
  const attacks = table(section(md, "## How each attack is treated")).map(([attack, at, how, status]) => {
    const kind = /✅ (structural|default|process|boundary)/.exec(status)?.[1] as Status | undefined;
    if (!kind) throw new Error(`SECURITY-BY-CONSTRUCTION.md: unknown status "${status}" for ${attack}`);
    return { attack, at, how, status: kind, note: status.replace(/^✅ \w+\s*(·\s*)?/, "") };
  });
  return {
    intro: paragraphs(md.slice(md.indexOf("\n") + 1, md.indexOf("\n## "))),
    principle: paragraphs(principle),
    sinks: table(principle).map(([sink, defense, where]) => ({ sink, defense, where })),
    attacks,
    cannot: paragraphs(section(md, "### What the UI cannot do")),
    mitre: table(section(md, "## MITRE ATT&CK and ATLAS coverage")).map(([technique, treatment]) => ({ technique, treatment })),
    l3: table(section(md, "## L3 Regulated in this repository")).map(([requirement, how]) => ({ requirement, how })),
    checklist: section(md, "## Checklist for an app built with Aedis UI")
      .split("\n")
      .filter((l) => l.startsWith("- [ ] "))
      .map((l) => l.slice(6)),
  };
}
