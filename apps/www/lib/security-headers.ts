import { allowedOrigins } from "@/lib/untrusted";

export type SecurityHeadersOptions = {
  /** Per-request nonce for the scripts the framework emits; what makes a CSP without 'unsafe-inline' possible. */
  nonce: string;
  /** Extra origins the page may fetch or stream from, e.g. an API on another host. Same-origin is always allowed. */
  connectSrc?: string[];
  /** Extra origins for images, e.g. an avatar CDN. Same-origin and data: are always allowed. */
  imgSrc?: string[];
  /** Origins allowed to frame this page. Empty by default: nobody may frame it (clickjacking). */
  frameAncestors?: string[];
  /** Origins this page may frame. Unset, frames fall back to default-src ('self'). */
  frameSrc?: string[];
};

/** Exact origins (and 'self'); wildcards and malformed entries are dropped, never widened. */
const sources = (list: string[]) => [...(list.includes("'self'") ? ["'self'"] : []), ...allowedOrigins(list)];

/**
 * HTTP response headers for an app built with Aedis UI: a strict CSP (no inline script, no eval, no plugins, no
 * framing, forms only to this origin), HSTS, no MIME sniffing, no referrer leak, no powerful browser features and
 * no caching of pages that may hold personal data. Apply them from the framework's middleware or the edge; the
 * docs site is static and cannot send them.
 */
export function securityHeaders({ nonce, connectSrc = [], imgSrc = [], frameAncestors: ancestors = [], frameSrc }: SecurityHeadersOptions): Record<string, string> {
  const frameAncestors = sources(ancestors);
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    // Inline style attributes come from the components; scripts never do.
    "style-src 'self' 'unsafe-inline'",
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
    "Cache-Control": "no-store",
  };
}
