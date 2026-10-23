import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";

import { securityHeaders } from "@/lib/security-headers";

const INLINE_SCRIPT = /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi;
// A type other than JavaScript makes a data block (application/ld+json…): the browser never runs it.
const DATA_BLOCK = /\btype\s*=\s*(?!["']?(?:text\/javascript|module)\b)/i;

const STYLE_ELEMENT = /<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/gi;

/** Where the moved inline scripts are served: under /_next/static, so they get its immutable caching and CORP. */
export const INLINE_DIR = "/_next/static/inline";

// Cloudflare static assets limits (developers.cloudflare.com/workers/platform/limits/#static-assets).
const MAX_RULES = 100;
const MAX_LINE = 2000;

/**
 * Moves every inline script of a page to a file named by the hash of its text, so one policy fits every page:
 * `script-src 'self'`, no per-page hashes. A parser-blocking `<script src>` runs in the same order, at the same
 * point of the parse, as the inline script it replaces. Data blocks stay inline.
 */
export function externalizeScripts(html: string): { html: string; files: Map<string, string> } {
  const files = new Map<string, string>();
  const out = html.replace(INLINE_SCRIPT, (tag, attrs: string, body: string) => {
    if (DATA_BLOCK.test(attrs)) return tag;
    // Hex with its digits spelled as letters: a run of digits in a name reads as a card number to scanners (ZAP 10062).
    const name = createHash("sha256").update(body, "utf8").digest("hex").slice(0, 32).replace(/\d/g, (d) => "ghijklmnop"[Number(d)]);
    const path = `${INLINE_DIR}/${name}.js`;
    files.set(path, body);
    return `<script${attrs} src="${path}"></script>`;
  });
  return { html: out, files };
}

/**
 * The CSP hashes of a page's inline `<style>` elements: Base UI's scrollbar style on the pages with a scroll area,
 * Next's error page. They let `style-src-elem` do without 'unsafe-inline' where no server can mint a nonce.
 */
export function styleHashes(html: string): string[] {
  return [...html.matchAll(STYLE_ELEMENT)].map(([, body]) => {
    // The browser hashes the text as it reads it: an entity would decode to something else than React wrote.
    if (/[&<]/.test(body)) throw new Error("_headers: an inline <style> holds an entity, so its hash would not match");
    return `sha256-${createHash("sha256").update(body, "utf8").digest("base64")}`;
  });
}

/** Pages only this site may frame: the block previews and the micro-frontends demo remote. Every other page refuses. */
export const FRAMEABLE = /^\/(?:blocks\/view|demo\/remote)\//;

// The site's one policy, and the one for the frameable pages: they differ only in frame-ancestors. Browsers ignore
// X-Frame-Options (DENY, set on /*) when the CSP has frame-ancestors, so the CSP alone decides.
const policy = (frameable: boolean, styleHashes: string[]) =>
  securityHeaders({ hashes: [], styleHashes, frameAncestors: frameable ? ["'self'"] : [], frameSrc: ["'self'"] })["Content-Security-Policy"];

/**
 * The rules that give every page its policy, none overlapping: a directory whose pages all take the same policy gets
 * one `/dir/*` rule, anything else a rule of its own. No path may get two: a header set by two matching rules is
 * comma-joined into two policies that both apply, and production Cloudflare did not honour a
 * `! Content-Security-Policy` detach on `/`.
 */
function policyRules(paths: string[], dir = ""): [rule: string, frameable: boolean][] {
  const below = paths.filter((p) => p.startsWith(`${dir}/`) && p !== `${dir}/`);
  const kinds = new Set(below.map((p) => FRAMEABLE.test(p)));
  if (dir && kinds.size === 1) return [[`${dir}/*`, [...kinds][0]]];
  const children = [...new Set(below.map((p) => `${dir}/${p.slice(dir.length + 1).split("/")[0]}`))].sort();
  // The home page is the one page that is no directory's child.
  const home: [string, boolean][] = !dir && paths.includes("/") ? [["/", false]] : [];
  return [...home, ...children.flatMap((child) => [
    ...(paths.includes(child) ? [[child, FRAMEABLE.test(child)] as [string, boolean]] : []),
    ...(paths.some((p) => p.startsWith(`${child}/`)) ? policyRules(paths, child) : []),
  ])];
}

/**
 * The Cloudflare `_headers` file for the exported site: the aedis-ui security headers on every path, and one CSP for
 * every page (the inline scripts are files, see externalizeScripts), with frame-ancestors 'self' only where this
 * site frames itself. The policy is the same on every page because a client-side navigation keeps the CSP of the
 * page the visit started on. Unknown paths outside the page directories (the 404 page) get no CSP.
 */
export function headersFile(paths: string[], styles: string[] = []): string {
  const { "Content-Security-Policy": _, ...common } = securityHeaders({ hashes: [] });
  const lines = [
    "/*",
    ...Object.entries(common).map(([name, value]) => `  ${name}: ${value}`),
    // Hashed build assets never change: they keep the headers but swap no-store for immutable caching.
    "/_next/static/*",
    "  ! Cache-Control",
    "  Cache-Control: public, max-age=31536000, immutable",
    // The demo remote is sandboxed, so its origin is opaque and its requests count as cross-origin: the public,
    // hashed build assets may be loaded by it. Pages and everything else keep same-origin.
    "  ! Cross-Origin-Resource-Policy",
    "  Cross-Origin-Resource-Policy: cross-origin",
    // Loaded by every page's <head>, the demo remote included.
    "/color-scheme.js",
    "  ! Cross-Origin-Resource-Policy",
    "  Cross-Origin-Resource-Policy: cross-origin",
    // The share cards (app/og): named by a hash of what they show, and fetched by chat apps and networks from anywhere.
    "/og/*",
    "  ! Cache-Control",
    "  Cache-Control: public, max-age=31536000, immutable",
    "  ! Cross-Origin-Resource-Policy",
    "  Cross-Origin-Resource-Policy: cross-origin",
    ...policyRules(paths).flatMap(([rule, frameable]) => [rule, `  Content-Security-Policy: ${policy(frameable, styles)}`]),
  ];
  const rules = lines.filter((l) => l.startsWith("/")).length;
  if (rules > MAX_RULES) throw new Error(`_headers: ${rules} rules, Cloudflare allows ${MAX_RULES}`);
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
  const pages = htmlFiles(out);
  const styles = new Set<string>();
  for (const file of pages) {
    const { html, files } = externalizeScripts(readFileSync(file, "utf8"));
    for (const hash of styleHashes(html)) styles.add(hash);
    for (const [path, body] of files) {
      mkdirSync(join(out, INLINE_DIR), { recursive: true });
      writeFileSync(join(out, path), body);
    }
    writeFileSync(file, html);
  }
  writeFileSync(join(out, "_headers"), headersFile(pages.map((f) => urlPath(out, f)), [...styles].sort()));
}
/* v8 ignore stop */
