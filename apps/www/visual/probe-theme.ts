// #288: a test-only theme that paints every colour token in its own colour, so a token no element uses shows up.
// Not in the registry and never published: only theme-probe.behaviour.spec.ts and its unit test read it.

/** FNV-1a of the name: the same name always gets the same colour, on any machine. */
function hash(name: string) {
  let h = 0x811c9dc5;
  for (const c of name) h = Math.imul(h ^ c.codePointAt(0)!, 0x01000193) >>> 0;
  return h;
}

/** An opaque `#rrggbb` per token, derived from a hash of its name. The unit test proves they are all far apart. */
export function probeTheme(names: readonly string[]): Record<string, string> {
  return Object.fromEntries(names.map((n) => [n, `#${(hash(n) & 0xffffff).toString(16).padStart(6, "0")}`]));
}

/**
 * The tokens whose colour appears in any of the computed values. `keys` holds, per token, the strings the browser
 * computes for it (read back from a reference element, never converted by hand): its opaque `rgb(…)` and the
 * `oklab(L a b /` start that a Tailwind opacity modifier (`bg-x/10`, a colour-mix with transparent) keeps.
 */
export function tokensIn(values: Iterable<string>, keys: Record<string, readonly string[]>): Set<string> {
  const all = [...values].join("\n");
  return new Set(Object.keys(keys).filter((n) => keys[n]!.some((k) => k !== "" && all.includes(k))));
}

/**
 * What the probe reports: tokens no element painted and that are not exempt with a reason, and exemptions that are
 * stale (the token is painted now, or no longer exists), so the list only ever holds what is true.
 */
export function probeReport(names: readonly string[], found: Set<string>, exempt: Record<string, string>) {
  return {
    unused: names.filter((n) => !found.has(n) && !(n in exempt)),
    staleExemptions: Object.keys(exempt).filter((n) => found.has(n) || !names.includes(n)),
  };
}
