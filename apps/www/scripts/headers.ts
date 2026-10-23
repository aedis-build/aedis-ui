import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";

import { securityHeaders } from "@/lib/security-headers";

const INLINE_SCRIPT = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;

// Cloudflare static assets limits (developers.cloudflare.com/workers/platform/limits/#static-assets).
const MAX_RULES = 100;
const MAX_LINE = 2000;

/** sha256 of each inline script, over the exact text the browser hashes. */
export function inlineScriptHashes(html: string): string[] {
  return [...html.matchAll(INLINE_SCRIPT)].map(([, body]) => `sha256-${createHash("sha256").update(body, "utf8").digest("base64")}`);
}

/** Pages only this site may frame: the block previews of the Blocks pages. Every other page refuses all framing. */
export const FRAMEABLE = /^\/blocks\/view\//;

// Browsers ignore X-Frame-Options (DENY, set on /*) when the CSP has frame-ancestors, so the CSP alone decides.
const csp = (path: string, html: string) =>
  securityHeaders({ hashes: [...new Set(inlineScriptHashes(html))].sort(), frameAncestors: FRAMEABLE.test(path) ? ["'self'"] : [] })["Content-Security-Policy"];

/**
 * The Cloudflare `_headers` file for the exported site: the aedis-ui security headers on every path, and a CSP per
 * page with the hashes of that page's inline scripts. One policy for the whole site does not fit: Cloudflare caps a
 * line at 2,000 characters. Only page rules set a CSP, so no path gets two: a header set by two matching rules is
 * comma-joined into two policies that both apply, and production Cloudflare did not honour a `! Content-Security-Policy`
 * detach on `/`. Unknown paths (the 404 page) get the other headers but no CSP.
 */
export function headersFile(pages: [path: string, html: string][]): string {
  const { "Content-Security-Policy": _, ...common } = securityHeaders({ hashes: [] });
  const lines = [
    "/*",
    ...Object.entries(common).map(([name, value]) => `  ${name}: ${value}`),
    // Hashed build assets never change: they keep the headers but swap no-store for immutable caching.
    "/_next/static/*",
    "  ! Cache-Control",
    "  Cache-Control: public, max-age=31536000, immutable",
    ...pages.flatMap(([path, html]) => [path, `  Content-Security-Policy: ${csp(path, html)}`]),
  ];
  // shortcut: one rule per page, fine up to ~98 pages; past that, move the inline scripts to files and drop the hashes.
  if (pages.length + 2 > MAX_RULES) throw new Error(`_headers: ${pages.length + 2} rules, Cloudflare allows ${MAX_RULES}`);
  const long = lines.find((l) => l.length > MAX_LINE);
  if (long !== undefined) throw new Error(`_headers: a line has ${long.length} characters, Cloudflare allows ${MAX_LINE}`);
  return [...lines, ""].join("\n");
}

/** Every exported page under `dir`. */
export function htmlFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((e) => e.isFile() && e.name.endsWith(".html"))
    .map((e) => join(e.parentPath, e.name));
}

/** The URL path Cloudflare serves an exported page at (html_handling auto-trailing-slash): docs/a.html is /docs/a. */
export function urlPath(dir: string, file: string): string {
  return `/${relative(dir, file).replaceAll("\\", "/")}`.replace(/\.html$/, "").replace(/(^|\/)index$/, "$1");
}

// The CLI entry: `tsx scripts/headers.ts out` after `next build` (apps/www build script).
/* v8 ignore start */
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const out = process.argv[2] ?? "out";
  writeFileSync(join(out, "_headers"), headersFile(htmlFiles(out).map((f) => [urlPath(out, f), readFileSync(f, "utf8")])));
}
/* v8 ignore stop */
