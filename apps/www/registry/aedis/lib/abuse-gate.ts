/**
 * Where the abuse libraries keep their counters. Values are short strings (JSON); keys are HMACs, never personal data.
 * Back it with Redis, KV or a table in production; `memoryCache` is for one process and for tests.
 */
export interface AbuseCache {
  get(key: string): Promise<string | undefined> | string | undefined;
  set(key: string, value: string, ttlMs: number): Promise<void> | void;
  delete(key: string): Promise<void> | void;
}

/** In-process cache with expiry, bounded so a flood of new keys cannot grow it without limit (oldest go first). */
export function memoryCache({ maxEntries = 10_000, now = Date.now }: { maxEntries?: number; now?: () => number } = {}): AbuseCache {
  const store = new Map<string, { value: string; expires: number }>();
  return {
    get(key) {
      const hit = store.get(key);
      if (!hit) return undefined;
      if (hit.expires <= now()) return void store.delete(key);
      return hit.value;
    },
    set(key, value, ttlMs) {
      store.delete(key);
      store.set(key, { value, expires: now() + ttlMs });
      if (store.size > maxEntries) store.delete(store.keys().next().value!);
    },
    delete(key) {
      store.delete(key);
    },
  };
}

const MIN_SECRET = 32;

/** Trimmed, NFKC, lower case, inner spaces collapsed: "  Ana@Studio.com " and "ana@studio.com" are the same target. */
export const normalize = (part: string) => part.normalize("NFKC").trim().toLowerCase().replace(/\s+/g, " ");

const encoder = new TextEncoder();
const keys = new Map<string, Promise<CryptoKey>>();

export function hmacCryptoKey(secret: string) {
  if (typeof secret !== "string" || secret.length < MIN_SECRET) throw new Error(`abuse: the secret must be at least ${MIN_SECRET} characters`);
  let key = keys.get(secret);
  if (!key) keys.set(secret, (key = crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"])));
  return key;
}

export const base64url = (bytes: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/** An HMAC-SHA-256 of the normalized parts, in a namespace: what the cache stores instead of an email or an IP. */
export async function hmacKey(secret: string, namespace: string, parts: string[]) {
  const data = encoder.encode([namespace, ...parts.map(normalize)].join("\u0000"));
  return `${namespace}:${base64url(await crypto.subtle.sign("HMAC", await hmacCryptoKey(secret), data))}`;
}

export type AbuseGateOptions = {
  /** At least 32 characters, from the server's secrets; never sent to the browser. */
  secret: string;
  /** Submits allowed per target in the window. */
  limit?: number;
  windowMs?: number;
  /** Submits allowed per IP in its window, whatever the target. */
  ipLimit?: number;
  ipWindowMs?: number;
  cache?: AbuseCache;
  now?: () => number;
};

export type GateResult = { ok: true } | { ok: false; reason: "target" | "ip"; retryAfterMs: number };

/**
 * A sliding window per target (an HMAC of e.g. the normalized email and company) and a wider one per IP. A refused
 * submit is not counted. Usable as secureAction's `rateLimit` or in a route handler.
 *
 *   const gate = abuseGate({ secret: process.env.ABUSE_SECRET! });
 *   rateLimit: async (ctx) => (await gate.check({ target: [ctx.email, ctx.company], ip: ctx.ip })).ok
 */
export function abuseGate({ secret, limit = 5, windowMs = 60 * 60_000, ipLimit = 20, ipWindowMs = windowMs, cache = memoryCache(), now = Date.now }: AbuseGateOptions) {
  hmacCryptoKey(secret);
  const recent = async (key: string, window: number, t: number) => {
    const raw = await cache.get(key);
    const list = raw ? (JSON.parse(raw) as number[]) : [];
    return list.filter((s) => s > t - window);
  };
  return {
    // shortcut: read-then-write is not atomic across processes; use a store with atomic increments under heavy concurrent load.
    async check({ target, ip }: { target: string[]; ip?: string }): Promise<GateResult> {
      const t = now();
      const targetKey = await hmacKey(secret, "target", target);
      const ipKey = ip ? await hmacKey(secret, "ip", [ip]) : null;
      const byTarget = await recent(targetKey, windowMs, t);
      // A full window frees a place when its oldest submit leaves it; a limit of 0 never does, so it waits a whole window.
      const wait = (list: number[], window: number) => (list[0] === undefined ? window : list[0] + window - t);
      if (byTarget.length >= limit) return { ok: false, reason: "target", retryAfterMs: wait(byTarget, windowMs) };
      const byIp = ipKey ? await recent(ipKey, ipWindowMs, t) : [];
      if (ipKey && byIp.length >= ipLimit) return { ok: false, reason: "ip", retryAfterMs: wait(byIp, ipWindowMs) };
      await cache.set(targetKey, JSON.stringify([...byTarget, t]), windowMs);
      if (ipKey) await cache.set(ipKey, JSON.stringify([...byIp, t]), ipWindowMs);
      return { ok: true };
    },
  };
}
