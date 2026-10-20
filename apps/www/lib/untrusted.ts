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

/** Keeps only http, https, mailto and relative URLs; anything else (javascript:, data:, vbscript:) becomes empty. */
export function safeUrl(url: string): string {
  const trimmed = url.trim();
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) return trimmed;
  try {
    return SAFE_PROTOCOLS.includes(new URL(trimmed).protocol) ? trimmed : "";
  } catch {
    return "";
  }
}

/** True for an absolute http(s) URL on another origin. On the server every absolute URL counts as external. */
export function isExternal(url: string): boolean {
  if (!/^https?:\/\//i.test(url.trim())) return false;
  try {
    return typeof window === "undefined" || new URL(url).origin !== window.location.origin;
  } catch {
    return false;
  }
}
