// @vitest-environment node
import fc from "fast-check";

import { abuseGate, hmacKey, memoryCache, normalize } from "@/registry/aedis/lib/abuse-gate";
import { bruteForceGuard } from "@/registry/aedis/lib/brute-force-guard";
import { issueFormToken, verifyFormToken } from "@/registry/aedis/lib/form-token";

const SECRET = "test-secret-that-is-long-enough-0123456789";
const MIN = 60_000;

function clock(start = Date.UTC(2026, 9, 28)) {
  let t = start;
  return { now: () => t, advance: (ms: number) => (t += ms) };
}

describe("abuse gate (#200)", () => {
  it("allows `limit` submits per target in a sliding window, and does not count refused ones", async () => {
    const c = clock();
    const gate = abuseGate({ secret: SECRET, limit: 3, windowMs: 10 * MIN, ipLimit: 100, now: c.now, cache: memoryCache({ now: c.now }) });
    const target = ["ana@studio.com", "Ceramics Studio"];
    for (let i = 0; i < 3; i++) {
      expect(await gate.check({ target, ip: "203.0.113.7" })).toEqual({ ok: true });
      c.advance(MIN);
    }
    expect(await gate.check({ target: [" ANA@studio.com ", "ceramics  studio"] })).toEqual({ ok: false, reason: "target", retryAfterMs: 7 * MIN });
    c.advance(7 * MIN);
    expect(await gate.check({ target })).toEqual({ ok: true });
    expect(await gate.check({ target: ["bruno@bakery.com", "Bakery"] })).toEqual({ ok: true });
  });

  it("caps an IP across targets", async () => {
    const c = clock();
    const gate = abuseGate({ secret: SECRET, limit: 10, ipLimit: 2, windowMs: MIN, now: c.now, cache: memoryCache({ now: c.now }) });
    expect((await gate.check({ target: ["a@x.com"], ip: "198.51.100.1" })).ok).toBe(true);
    expect((await gate.check({ target: ["b@x.com"], ip: "198.51.100.1" })).ok).toBe(true);
    expect(await gate.check({ target: ["c@x.com"], ip: "198.51.100.1" })).toMatchObject({ ok: false, reason: "ip" });
    expect((await gate.check({ target: ["c@x.com"], ip: "198.51.100.2" })).ok).toBe(true);
  });

  it("stores only HMACs, never the email, company or IP", async () => {
    const seen: string[] = [];
    const cache = memoryCache();
    const spy = { get: cache.get, delete: cache.delete, set: (k: string, v: string, ttl: number) => (seen.push(k, v), cache.set(k, v, ttl)) };
    await abuseGate({ secret: SECRET, cache: spy }).check({ target: ["ana@studio.com", "Ceramics"], ip: "203.0.113.7" });
    expect(seen.join(" ")).not.toMatch(/ana|studio|ceramics|203\.0/i);
    expect(seen.filter((s) => s.includes(":"))).toEqual([expect.stringMatching(/^target:[\w-]{43}$/), expect.stringMatching(/^ip:[\w-]{43}$/)]);
  });

  it("refuses a short secret, and keys the same target the same way however it is typed (property)", async () => {
    expect(() => abuseGate({ secret: "short" })).toThrow(/at least 32/);
    await fc.assert(
      fc.asyncProperty(fc.string({ maxLength: 40 }), async (s) => {
        expect(await hmacKey(SECRET, "t", [`  ${s.toUpperCase()} `])).toBe(await hmacKey(SECRET, "t", [normalize(s)]));
      }),
      { numRuns: 50 },
    );
  });

  it("keeps the in-memory cache bounded and expires entries", () => {
    const c = clock();
    const cache = memoryCache({ maxEntries: 2, now: c.now });
    cache.set("a", "1", MIN);
    cache.set("b", "2", MIN);
    cache.set("c", "3", MIN);
    expect([cache.get("a"), cache.get("b"), cache.get("c")]).toEqual([undefined, "2", "3"]);
    c.advance(MIN);
    expect(cache.get("b")).toBeUndefined();
  });
});

describe("brute-force guard (#200)", () => {
  it("locks for 1 min, then 15 min, then 1 h, and a success starts over", async () => {
    const c = clock();
    const guard = bruteForceGuard({ secret: SECRET, maxFailures: 3, now: c.now, cache: memoryCache({ now: c.now }) });
    const who = ["ana@studio.com"];
    const failTimes = async (n: number) => {
      let last = 0;
      for (let i = 0; i < n; i++) last = (await guard.fail(who)).lockedForMs;
      return last;
    };
    expect(await failTimes(2)).toBe(0);
    expect(await guard.check(who)).toEqual({ ok: true });
    expect(await failTimes(1)).toBe(MIN);
    expect(await guard.check(who)).toEqual({ ok: false, retryAfterMs: MIN });
    c.advance(MIN);
    expect(await guard.check(who)).toEqual({ ok: true });
    expect(await failTimes(3)).toBe(15 * MIN);
    c.advance(15 * MIN);
    expect(await failTimes(3)).toBe(60 * MIN);
    c.advance(60 * MIN);
    expect(await failTimes(3)).toBe(60 * MIN);
    c.advance(60 * MIN);
    await guard.succeed(who);
    expect(await failTimes(3)).toBe(MIN);
  });
});

describe("form token (#200)", () => {
  it("accepts a submit between 3 s and 1 h after the form was signed", async () => {
    const t0 = Date.UTC(2026, 9, 28);
    const token = await issueFormToken(SECRET, { form: "contact", now: t0 });
    expect(token).toMatch(/^v1\.\d{13}\.[\w-]{43}$/);
    expect(await verifyFormToken(SECRET, token, { form: "contact", now: t0 + 1_000 })).toEqual({ ok: false, reason: "too-fast" });
    expect(await verifyFormToken(SECRET, token, { form: "contact", now: t0 + 5_000 })).toEqual({ ok: true, ageMs: 5_000 });
    expect(await verifyFormToken(SECRET, token, { form: "contact", now: t0 + 61 * MIN })).toEqual({ ok: false, reason: "expired" });
  });

  it("refuses another form's token, another secret's, and anything malformed", async () => {
    const t0 = Date.UTC(2026, 9, 28);
    const token = await issueFormToken(SECRET, { form: "contact", now: t0 });
    expect(await verifyFormToken(SECRET, token, { form: "login", now: t0 + 5_000 })).toEqual({ ok: false, reason: "signature" });
    expect(await verifyFormToken(`${SECRET}-other`, token, { form: "contact", now: t0 + 5_000 })).toEqual({ ok: false, reason: "signature" });
    for (const bad of [undefined, 42, "", "v1.1.x", `${token}x`, token.replace("v1", "v2")]) expect(await verifyFormToken(SECRET, bad, { form: "contact" })).toEqual({ ok: false, reason: "malformed" });
  });

  it("never accepts a token with any character changed (property)", async () => {
    const t0 = Date.UTC(2026, 9, 28);
    const token = await issueFormToken(SECRET, { now: t0 });
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 0, max: token.length - 1 }), fc.constantFrom(..."0123456789abcdefABCDEF-_."), async (i, ch) => {
        fc.pre(token[i] !== ch);
        const tampered = token.slice(0, i) + ch + token.slice(i + 1);
        expect((await verifyFormToken(SECRET, tampered, { now: t0 + 5_000 })).ok).toBe(false);
      }),
      { numRuns: 100 },
    );
  });
});
