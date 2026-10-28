import { hmacCryptoKey, hmacKey, memoryCache, type AbuseCache } from "@/registry/aedis/lib/abuse-gate";

export type BruteForceGuardOptions = {
  /** At least 32 characters, from the server's secrets. */
  secret: string;
  /** Failures that trigger the next lockout. */
  maxFailures?: number;
  /** One lockout per step, the last repeating: 1 min, then 15 min, then 1 h. */
  steps?: number[];
  /** A subject with no failure for this long starts over. */
  resetMs?: number;
  cache?: AbuseCache;
  now?: () => number;
};

type State = { failures: number; lockouts: number; lockedUntil: number };

/**
 * Progressive lockouts for a subject (an HMAC of e.g. the normalized email, or email and IP): after `maxFailures`
 * failures it locks for 1 min, then 15 min, then 1 h each time. Check before trying, report the outcome after.
 */
export function bruteForceGuard({ secret, maxFailures = 5, steps = [60_000, 15 * 60_000, 60 * 60_000], resetMs = 24 * 60 * 60_000, cache = memoryCache(), now = Date.now }: BruteForceGuardOptions) {
  hmacCryptoKey(secret);
  const key = (subject: string[]) => hmacKey(secret, "login", subject);
  const read = async (k: string): Promise<State> => {
    const raw = await cache.get(k);
    return raw ? (JSON.parse(raw) as State) : { failures: 0, lockouts: 0, lockedUntil: 0 };
  };
  return {
    async check(subject: string[]): Promise<{ ok: true } | { ok: false; retryAfterMs: number }> {
      const s = await read(await key(subject));
      const wait = s.lockedUntil - now();
      return wait > 0 ? { ok: false, retryAfterMs: wait } : { ok: true };
    },
    /** Records a failure; returns how long the subject is now locked (0 when not yet). */
    async fail(subject: string[]): Promise<{ lockedForMs: number }> {
      const k = await key(subject);
      const s = await read(k);
      s.failures += 1;
      let lockedForMs = 0;
      if (s.failures >= maxFailures) {
        lockedForMs = steps[Math.min(s.lockouts, steps.length - 1)];
        s.lockouts += 1;
        s.failures = 0;
        s.lockedUntil = now() + lockedForMs;
      }
      await cache.set(k, JSON.stringify(s), Math.max(resetMs, lockedForMs));
      return { lockedForMs };
    },
    /** A success clears the subject's failures and lockouts. */
    async succeed(subject: string[]) {
      await cache.delete(await key(subject));
    },
  };
}
