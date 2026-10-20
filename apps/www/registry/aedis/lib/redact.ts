import { stripInvisible } from "@/lib/untrusted";

/** Keys whose values are never shown. Matched case-insensitively, ignoring "-", "_" and spaces, anywhere in the key. */
export const SECRET_KEYS = ["password", "passwd", "secret", "token", "authorization", "apikey", "privatekey", "accesskey", "cookie", "session", "credential", "signature"];

export const REDACTED = "[redacted]";

/** True when a key looks like it holds a secret (same rule as redact). */
export function isSecretKey(key: string, keys: string[] = SECRET_KEYS) {
  const k = key.toLowerCase().replace(/[-_\s]/g, "");
  return keys.some((s) => k.includes(s.toLowerCase().replace(/[-_\s]/g, "")));
}

/** True when any key, at any depth, looks like it holds a secret. */
export function hasSecretKey(value: unknown, keys: string[] = SECRET_KEYS, depth = 0): boolean {
  if (value === null || typeof value !== "object" || depth > 16) return false;
  return Object.entries(value).some(([k, v]) => isSecretKey(k, keys) || hasSecretKey(v, keys, depth + 1));
}

export type RedactOptions = {
  /** Replaces the default list. */
  keys?: string[];
  /** Strings longer than this are cut. */
  maxString?: number;
  maxDepth?: number;
  /** Arrays and objects keep at most this many entries. */
  maxItems?: number;
};

const normalize = (key: string) => key.toLowerCase().replace(/[-_\s]/g, "");

// Secrets that show up inside text: bearer tokens, JWTs, and key=value or key: value pairs with a secret key.
const BEARER = /\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]{8,}/g;
const JWT = /\beyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\b/g;

/** Removes secrets from free text (tool output, reasoning) and the code points that hide text. */
export function redactText(text: string, keys: string[] = SECRET_KEYS) {
  const secret = keys.map(normalize);
  return stripInvisible(text)
    .replace(BEARER, (_m, scheme: string) => `${scheme} ${REDACTED}`)
    .replace(JWT, REDACTED)
    .replace(PAIR, (match, key: string, sep: string) => (secret.some((s) => normalize(key).includes(s)) ? `${key}${sep}${REDACTED}` : match));
}

// key=value, key: value, "key": "value"; the key is tested with the same rule as object keys.
const PAIR = /\b([A-Za-z][\w-]*)("?\s*[:=]\s*)("[^"]*"|'[^']*'|[^\s,;&]+)/g;

/**
 * A copy of `value` safe to show: values under secret-looking keys become "[redacted]", strings are scanned with
 * redactText and cut, and depth, size and cycles are bounded. The input is never modified.
 */
export function redact(value: unknown, { keys = SECRET_KEYS, maxString = 2000, maxDepth = 8, maxItems = 100 }: RedactOptions = {}): unknown {
  const secret = keys.map(normalize);
  const seen = new WeakSet<object>();
  const cut = (s: string) => (s.length > maxString ? `${s.slice(0, maxString)}… (${s.length - maxString} more)` : s);

  const walk = (v: unknown, depth: number): unknown => {
    if (typeof v === "string") return cut(redactText(v, keys));
    if (typeof v === "bigint") return `${v}n`;
    if (typeof v === "function" || typeof v === "symbol") return `[${typeof v}]`;
    if (v === null || typeof v !== "object") return v;
    if (seen.has(v)) return "[circular]";
    if (depth >= maxDepth) return "[…]";
    seen.add(v);
    if (Array.isArray(v)) {
      const items = v.slice(0, maxItems).map((x) => walk(x, depth + 1));
      return v.length > maxItems ? [...items, `… ${v.length - maxItems} more`] : items;
    }
    if (v instanceof Date) return v.toISOString();
    const entries = Object.entries(v);
    const out: Record<string, unknown> = {};
    for (const [k, x] of entries.slice(0, maxItems)) {
      const key = stripInvisible(k);
      out[key] = secret.some((s) => normalize(key).includes(s)) ? REDACTED : walk(x, depth + 1);
    }
    if (entries.length > maxItems) out["…"] = `${entries.length - maxItems} more`;
    return out;
  };
  return walk(value, 0);
}
