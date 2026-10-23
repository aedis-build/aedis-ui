/**
 * Aedis lint: the rules of the Aedis UI registry as a check any registry author can run (`aedis lint`), so a
 * registry in the Directory holds its items to the same rules as @aedis.
 *
 * - markup: no item renders a string as HTML (dangerouslySetInnerHTML, innerHTML, insertAdjacentHTML…).
 * - input: every native text field is bounded (maxLength).
 * - transport: no item talks to a backend directly (fetch, XMLHttpRequest, WebSocket, EventSource, axios); it goes
 *   through api(), which is same-origin, refuses redirects and sends the CSRF header.
 *
 * An item that is itself such a primitive says so in registry.json, with the reason, under
 * meta.aedisLint.<rule>; the exemption is visible to anyone who reads the registry.
 *
 * shortcut: line-based patterns, not a parser; a determined author can hide a call. It catches the honest mistake,
 * which is what a registry check is for; move to an AST (TypeScript compiler API) if a registry needs more.
 */
export type LintRule = "markup" | "input" | "transport";
export type LintFinding = { item: string; file: string; line: number; rule: LintRule; text: string };

const MARKUP = /dangerouslySetInnerHTML|\.(?:inner|outer)HTML\s*=|insertAdjacentHTML|document\.write\(/;
const TRANSPORT = /\bfetch\(|new XMLHttpRequest\(|new WebSocket\(|new EventSource\(|\baxios\b/;
const NATIVE_FIELD = /<(input|textarea)\b[^>]*>/gs;
const NOT_TEXT = /\btype=["'{](?:file|checkbox|radio|hidden|range|color|submit|button|reset|image)\b/;

const lineOf = (source: string, index: number) => source.slice(0, index).split("\n").length;

/** Every finding in one file of one item, minus the rules the item is exempt from. */
export function lintSource(item: string, file: string, source: string, exempt: Partial<Record<LintRule, string>> = {}): LintFinding[] {
  const found: LintFinding[] = [];
  const add = (rule: LintRule, line: number, text: string) => {
    if (!exempt[rule]?.trim()) found.push({ item, file, line, rule, text: text.trim().slice(0, 120) });
  };
  source.split("\n").forEach((text, i) => {
    if (MARKUP.test(text)) add("markup", i + 1, text);
    if (TRANSPORT.test(text)) add("transport", i + 1, text);
  });
  for (const m of source.matchAll(NATIVE_FIELD)) {
    if (!/\bmaxLength\b/.test(m[0]) && !NOT_TEXT.test(m[0])) add("input", lineOf(source, m.index), m[0].replace(/\s+/g, " "));
  }
  return found;
}

type Entry = { name?: unknown; files?: { path?: unknown }[]; meta?: { aedisLint?: Partial<Record<LintRule, string>> } };

/**
 * Lints a shadcn-style registry.json: every file of every item, read with `read` (paths relative to the registry).
 * Paths that leave the registry's directory are refused.
 */
export function lintRegistry(registry: unknown, read: (path: string) => string): LintFinding[] {
  const items = (registry as { items?: Entry[] })?.items;
  if (!Array.isArray(items)) throw new Error("lint: registry.json has no items");
  return items.flatMap((entry) => {
    const name = String(entry.name);
    return (entry.files ?? []).flatMap((f) => {
      const file = String(f.path);
      if (file.startsWith("/") || file.split(/[\\/]/).includes("..")) throw new Error(`lint: ${name} has a file outside the registry: ${file}`);
      return lintSource(name, file, read(file), entry.meta?.aedisLint);
    });
  });
}

export const lintMessages: Record<LintRule, string> = {
  markup: "renders a string as markup",
  input: "a text field without maxLength",
  transport: "talks to the backend without api()",
};
