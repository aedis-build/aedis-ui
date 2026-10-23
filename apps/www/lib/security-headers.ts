import { allowedOrigins } from "@/lib/untrusted";

export type SecurityHeadersOptions = {
  /** Per-request nonce for the scripts the framework emits; what makes a CSP without 'unsafe-inline' possible. */
  nonce?: string;
  /**
   * For a static site, where no server can mint a nonce: the hashes of its inline scripts, as `sha256-<base64>`
   * (or sha384/sha512), computed at build time. Give either `nonce` or `hashes`, never both. The policy is then
   * `'self'` plus the hashes, without `'strict-dynamic'`: under it browsers ignore `'self'`, and the page's own
   * `<script src>` tags, which carry no nonce, would be blocked.
   */
  hashes?: string[];
  /**
   * Hashes (`sha256-<base64>`, or sha384/sha512) of the inline `<style>` elements a page carries without a nonce:
   * Base UI's scrollbar style, the framework's error page. A static site computes them at build time
   * (scripts/headers.ts); an app with a nonce passes it to `ScrollArea` (`nonce` prop) and leaves this empty.
   */
  styleHashes?: string[];
  /** Extra origins the page may fetch or stream from, e.g. an API on another host. Same-origin is always allowed. */
  connectSrc?: string[];
  /** Extra origins for images, e.g. an avatar CDN. Same-origin and data: are always allowed. */
  imgSrc?: string[];
  /** Origins allowed to frame this page. Empty by default: nobody may frame it (clickjacking). */
  frameAncestors?: string[];
  /** Origins this page may frame. Unset, frames fall back to default-src ('self'). */
  frameSrc?: string[];
};

const HASH = /^sha(256|384|512)-[A-Za-z0-9+/]+={0,2}$/;
const NONCE = /^[A-Za-z0-9+/_-]+={0,2}$/;

/** Hash sources. A malformed value would break or widen the policy, so it throws. */
function hashSources(hashes: string[], what: string) {
  const bad = hashes.find((h) => !HASH.test(h));
  if (bad !== undefined) throw new Error(`securityHeaders: not a ${what} hash: ${bad}`);
  return hashes.map((h) => `'${h}'`);
}

/** The script sources that replace 'unsafe-inline'. */
function scriptSources(nonce: string | undefined, hashes: string[] | undefined) {
  if ((nonce === undefined) === (hashes === undefined)) throw new Error("securityHeaders: give either nonce or hashes");
  if (nonce !== undefined) {
    if (!NONCE.test(nonce)) throw new Error("securityHeaders: the nonce must be base64");
    return [`'nonce-${nonce}'`, "'strict-dynamic'"];
  }
  return hashSources(hashes!, "script");
}

/** Exact origins (and 'self'); wildcards and malformed entries are dropped, never widened. */
const sources = (list: string[]) => [...(list.includes("'self'") ? ["'self'"] : []), ...allowedOrigins(list)];

/**
 * HTTP response headers for an app built with Aedis UI: a strict CSP (no inline script, no eval, no plugins, no
 * framing, forms only to this origin), HSTS, no MIME sniffing, no referrer leak, no powerful browser features and
 * no caching of pages that may hold personal data. Apply them from the framework's middleware or the edge; the
 * static docs site ships them as a Cloudflare `_headers` file (scripts/headers.ts).
 */
export function securityHeaders({ nonce, hashes, styleHashes = [], connectSrc = [], imgSrc = [], frameAncestors: ancestors = [], frameSrc }: SecurityHeadersOptions): Record<string, string> {
  const frameAncestors = sources(ancestors);
  const csp = [
    "default-src 'self'",
    ["script-src 'self'", ...scriptSources(nonce, hashes)].join(" "),
    // CSP 3 splits styles: elements (<style>, <link>) only from this origin, the nonce or a build-time hash, so an
    // injected <style> is refused; attributes stay allowed, since the components set them and an attribute runs no
    // script and loads only what img-src and font-src let through. No style-src: a browser without the split
    // directives falls back to default-src 'self', stricter, never wider.
    ["style-src-elem 'self'", ...(nonce === undefined ? [] : [`'nonce-${nonce}'`]), ...hashSources(styleHashes, "style")].join(" "),
    "style-src-attr 'unsafe-inline'",
    ["img-src 'self' data:", ...imgSrc].join(" "),
    ["connect-src 'self'", ...connectSrc].join(" "),
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    frameAncestors.length ? `frame-ancestors ${frameAncestors.join(" ")}` : "frame-ancestors 'none'",
    ...(frameSrc ? [sources(frameSrc).length ? `frame-src ${sources(frameSrc).join(" ")}` : "frame-src 'none'"] : []),
    "upgrade-insecure-requests",
  ].join("; ");
  return {
    "Content-Security-Policy": csp,
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": frameAncestors.length ? "SAMEORIGIN" : "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    // no-transform: a proxy (Cloudflare's analytics or bot scripts) must not rewrite the page.
    "Cache-Control": "no-store, no-transform",
  };
}
