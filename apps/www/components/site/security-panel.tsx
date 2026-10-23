import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { Security } from "@/content/components";
import { Badge } from "@/registry/aedis/ui/badge";
import { Link } from "@/registry/aedis/ui/link";

const TESTS = "https://github.com/aedis-build/aedis-ui/blob/main/apps/www/test/";

/**
 * Throws when an item touches a sink without a defense, or a defense cites a test that does not exist, so the docs
 * build fails instead of publishing a claim without proof.
 */
export function checkEvidence(name: string, security: Security) {
  if (security.sinks.length > 0 && !security.defenses?.length) throw new Error(`${name}: touches ${security.sinks.join(", ")} but lists no defense`);
  for (const d of security.defenses ?? []) {
    for (const [file, test] of d.evidence) {
      let source: string;
      try {
        source = readFileSync(join(process.cwd(), "test", file), "utf8");
      } catch {
        throw new Error(`${name}: "${d.title}" cites test/${file}, which does not exist`);
      }
      if (!source.includes(test)) throw new Error(`${name}: "${d.title}" cites "${test}", which is not in test/${file}`);
    }
  }
}

/** The security panel of a docs page: sinks, each defense with the test that proves it, and the backend's part. */
export function SecurityPanel({ name, security }: { name: string; security: Security }) {
  checkEvidence(name, security);
  return (
    <div className="space-y-3 rounded-xl border border-hairline bg-muted/40 p-5">
      <p className="flex flex-wrap items-center gap-2 text-footnote text-muted-foreground">
        {security.sinks.length ? (
          <>
            Sinks: {security.sinks.map((s) => <Badge key={s} variant="outline">{s}</Badge>)}
          </>
        ) : (
          "Touches none of the four sinks (DOM, Input, Transport, Session)."
        )}
      </p>
      {security.defenses?.map((d) => (
        <div key={d.title} className="flex gap-3 rounded-lg bg-surface p-4 shadow-elevation-1">
          <span aria-hidden="true" className="flex size-6 shrink-0 items-center justify-center rounded-full bg-success/12 text-success">
            <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3.5 8.5l3 3 6-7" /></svg>
          </span>
          <div className="min-w-0 space-y-1">
            <p className="text-callout font-medium">{d.title}</p>
            <p className="text-callout text-muted-foreground">{d.text}</p>
            <p className="text-footnote text-muted-foreground">
              {d.evidence.map(([file, test], i) => (
                <span key={`${file}${test}`}>
                  {i > 0 ? " · " : "Test: "}
                  <Link href={`${TESTS}${file}`}>{file}</Link> › {test}
                </span>
              ))}
              {d.ids.length ? <> · {d.ids.join(", ")}</> : null}
            </p>
          </div>
        </div>
      ))}
      {security.backend ? (
        <p className="text-callout text-muted-foreground">
          <strong className="font-medium text-foreground">Still on your backend:</strong> {security.backend}
        </p>
      ) : null}
      {security.notes?.length ? (
        <ul className="list-disc space-y-1 pl-5 text-callout">
          {security.notes.map((n) => <li key={n}>{n}</li>)}
        </ul>
      ) : null}
    </div>
  );
}
