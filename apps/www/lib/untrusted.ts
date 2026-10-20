/**
 * Invisible code points that carry no visible text but can hide instructions from the person reading while an
 * agent still reads them (ASCII smuggling with Unicode tags, zero-width text, bidi overrides that reorder what is
 * shown). Zero-width joiner/non-joiner and the LRM/RLM marks stay: emoji sequences and Persian, Arabic and Indic
 * scripts need them.
 */
export const INVISIBLE = /[\u200B\u2060-\u2064\uFEFF\u202A-\u202E\u2066-\u2069\u{E0000}-\u{E007F}]/gu;

/** Removes hidden code points so what the person sees is what the agent gets, and the other way round. */
export function stripInvisible(text: string): string {
  return text.replace(INVISIBLE, "");
}

/** True when the text carries hidden code points; useful to warn before showing or sending it. */
export function hasInvisible(text: string): boolean {
  INVISIBLE.lastIndex = 0;
  return INVISIBLE.test(text);
}

const SAFE_PROTOCOLS = ["http:", "https:", "mailto:"];
const CONTROL = /[\u0000-\u001F\u007F]/;
// Only used to resolve relative references; never requested.
const BASE = "https://relative.invalid";

/**
 * Keeps http, https, mailto and relative URLs (`/a`, `#b`, `?page=2`, `docs/x`); anything else (javascript:, data:,
 * vbscript:) becomes empty. Control and invisible characters are refused outright: browsers drop some of them while
 * parsing, which is how `java\nscript:` sneaks past naive checks.
 */
export function safeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed || CONTROL.test(trimmed) || hasInvisible(trimmed)) return "";
  try {
    return SAFE_PROTOCOLS.includes(new URL(trimmed, BASE).protocol) ? trimmed : "";
  } catch {
    return "";
  }
}

/** True for a URL on another origin, including protocol-relative `//host`. On the server every absolute URL counts. */
export function isExternal(url: string): boolean {
  const t = url.trim();
  if (!/^(https?:)?\/\//i.test(t)) return false;
  try {
    return typeof window === "undefined" || new URL(t, window.location.href).origin !== window.location.origin;
  } catch {
    return false;
  }
}

/**
 * Exact origins from configuration ("https://app.example.com"). Anything that is not a plain http(s) origin
 * ("*", "null", a path, a wildcard host, garbage) is dropped: a malformed entry never widens the list.
 */
export function allowedOrigins(list: readonly string[]): string[] {
  const out = new Set<string>();
  for (const entry of list) {
    const value = typeof entry === "string" ? entry.trim().replace(/\/$/, "") : "";
    if (!/^https?:\/\/[^*\s/]+$/i.test(value)) continue;
    try {
      const url = new URL(value);
      if (url.origin === value.toLowerCase() || url.origin === value) out.add(url.origin);
    } catch {
      // ignored
    }
  }
  return [...out];
}
