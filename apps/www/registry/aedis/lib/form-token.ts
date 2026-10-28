import { base64url, hmacCryptoKey } from "@/registry/aedis/lib/abuse-gate";

// 32 bytes are 43 base64url characters; the last one carries 2 unused bits, so only its canonical form is accepted.
const TOKEN = /^v1\.(\d{13})\.([A-Za-z0-9_-]{42}[AEIMQUYcgkosw048])$/;
const encoder = new TextEncoder();

const signed = (form: string, issuedAt: number) => encoder.encode(`form-token\u0000${form}\u0000${issuedAt}`);

/** Signs the moment a form was rendered. Put it in a hidden field; the token holds no personal data. */
export async function issueFormToken(secret: string, { form = "", now = Date.now() }: { form?: string; now?: number } = {}) {
  const issuedAt = Math.floor(now);
  return `v1.${issuedAt}.${base64url(await crypto.subtle.sign("HMAC", await hmacCryptoKey(secret), signed(form, issuedAt)))}`;
}

export type FormTokenResult = { ok: true; ageMs: number } | { ok: false; reason: "malformed" | "signature" | "too-fast" | "expired" };

/**
 * Accepts a submit whose token this server signed for this form between `minAgeMs` (3 s: no person fills a form
 * faster) and `maxAgeMs` (1 h) ago. The signature is checked with crypto.subtle.verify, in constant time.
 */
export async function verifyFormToken(
  secret: string,
  token: unknown,
  { form = "", now = Date.now(), minAgeMs = 3_000, maxAgeMs = 60 * 60_000 }: { form?: string; now?: number; minAgeMs?: number; maxAgeMs?: number } = {},
): Promise<FormTokenResult> {
  const key = await hmacCryptoKey(secret);
  const match = typeof token === "string" ? TOKEN.exec(token) : null;
  const [, issued, signature] = match ?? [];
  if (issued === undefined || signature === undefined) return { ok: false, reason: "malformed" };
  const issuedAt = Number(issued);
  const sig = Uint8Array.from(atob(signature.replace(/-/g, "+").replace(/_/g, "/") + "="), (c) => c.charCodeAt(0));
  if (!(await crypto.subtle.verify("HMAC", key, sig, signed(form, issuedAt)))) return { ok: false, reason: "signature" };
  const ageMs = now - issuedAt;
  if (ageMs < minAgeMs) return { ok: false, reason: "too-fast" };
  if (ageMs > maxAgeMs) return { ok: false, reason: "expired" };
  return { ok: true, ageMs };
}
