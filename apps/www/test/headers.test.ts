import fc from "fast-check";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { externalizeScripts, headersFile, htmlFiles, INLINE_DIR, styleHashes, urlPath } from "@/scripts/headers";

/** The header lines of the rule for `path`. */
const rule = (file: string, path: string) => {
  const lines = file.split("\n");
  const start = lines.indexOf(path) + 1;
  const end = lines.findIndex((l, i) => i >= start && !l.startsWith("  "));
  return lines.slice(start, end);
};

/** Every CSP Cloudflare sends for `path`: the values of all the rules that match it (* matches anything). */
const policies = (file: string, path: string) =>
  file
    .split("\n")
    .filter((l) => l.startsWith("/") && new RegExp(`^${l.replaceAll(".", "\\.").replaceAll("*", ".*")}$`).test(path))
    .flatMap((r) => rule(file, r))
    .filter((l) => l.startsWith("  Content-Security-Policy: "));

const PAGES = ["/", "/404", "/blocks", "/blocks/agent-console", "/blocks/usage-limits", "/blocks/view/agent-console", "/blocks/view/usage-limits", "/charts", "/demo/remote/billing", "/docs", "/docs/button", "/docs/micro-frontends", "/micro-frontends"];

describe("_headers", () => {
  it("moves inline scripts to files named by their text, in place, and leaves data blocks and external scripts", () => {
    const html = `<script src="/a.js" async=""></script><script>self.__next_f.push([1,"x"])</script><script type="application/ld+json">{}</script><p>x</p><script>self.__next_f.push([1,"x"])</script><script type="module">b()</script>`;
    const { html: out, files } = externalizeScripts(html);
    expect([...files.values()]).toEqual(['self.__next_f.push([1,"x"])', "b()"]);
    const [same, mod] = [...files.keys()];
    // No digits: a run of them would read as a card number to a PII scanner.
    expect(same).toMatch(new RegExp(`^${INLINE_DIR}/[a-p]{32}\\.js$`));
    expect(out).toBe(`<script src="/a.js" async=""></script><script src="${same}"></script><script type="application/ld+json">{}</script><p>x</p><script src="${same}"></script><script type="module" src="${mod}"></script>`);
  });

  it("leaves no inline script in any page, whatever surrounds them", () => {
    const text = fc.string().filter((s) => !s.toLowerCase().includes("</script"));
    fc.assert(
      fc.property(fc.array(fc.tuple(text, fc.boolean())), text, (scripts, filler) => {
        const html = scripts.map(([body, external]) => (external ? `<script src="/x.js">${body}</script>` : `<script>${body}</script>`)).join(filler.replaceAll("<", ""));
        const { html: out, files } = externalizeScripts(html);
        expect(out).not.toMatch(/<script(?![^>]*\bsrc=)[^>]*>[^<]/);
        expect(new Set(files.values())).toEqual(new Set(scripts.filter(([, external]) => !external).map(([body]) => body)));
      }),
    );
  });

  it("hashes every inline <style> element, so the policy needs no 'unsafe-inline' for them", () => {
    const sha = (text: string) => `sha256-${createHash("sha256").update(text).digest("base64")}`;
    const html = `<style data-precedence="base-ui:low">.a{scrollbar-width:none}</style><p>x</p><style>body{margin:0}</style>`;
    expect(styleHashes(html)).toEqual([sha(".a{scrollbar-width:none}"), sha("body{margin:0}")]);
    expect(styleHashes("<p>no style</p>")).toEqual([]);
    // The browser hashes the decoded text, so an entity would never match: better to fail the build.
    expect(() => styleHashes("<style>a::before{content:'&gt;'}</style>")).toThrow(/entity/);
    const [one] = policies(headersFile(PAGES, [sha("body{margin:0}")]), "/docs/button");
    expect(one).toContain(`style-src-elem 'self' '${sha("body{margin:0}")}'; style-src-attr 'unsafe-inline';`);
    expect(one).not.toContain("style-src '");
  });

  it("sends every security header but the CSP on every path, and forbids proxies to rewrite pages", () => {
    const all = rule(headersFile([]), "/*");
    expect(all).toEqual(
      expect.arrayContaining([
        "  X-Frame-Options: DENY",
        "  Cross-Origin-Opener-Policy: same-origin",
        "  Cross-Origin-Resource-Policy: same-origin",
        "  Referrer-Policy: strict-origin-when-cross-origin",
        "  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()",
        "  X-Content-Type-Options: nosniff",
        "  Cache-Control: no-store, no-transform",
      ]),
    );
    expect(all.some((l) => l.startsWith("  Strict-Transport-Security: "))).toBe(true);
    expect(all.some((l) => l.includes("Content-Security-Policy"))).toBe(false);
  });

  // A client-side navigation keeps the CSP of the page the visit started on, so the policy may not depend on the page.
  it("gives every page exactly one policy, the same everywhere but for frame-ancestors, with no inline script and no detach", () => {
    const file = headersFile(PAGES);
    expect(file).not.toContain("! Content-Security-Policy");
    const [one] = policies(file, "/");
    for (const path of [...PAGES, "/docs/new-page", "/blocks/view/new-block", "/demo/remote/other"]) {
      const csp = policies(file, path);
      expect(csp).toHaveLength(1);
      expect(csp[0]).toContain("script-src 'self';");
      expect(csp[0]).toContain("frame-src 'self';");
      expect(csp[0].replace("frame-ancestors 'self'", "frame-ancestors 'none'")).toBe(one);
    }
  });

  it("lets only the block previews and the demo remote be framed, only by this site", () => {
    const file = headersFile(PAGES);
    for (const p of PAGES) expect(policies(file, p)[0]).toContain(/^\/(blocks\/view|demo\/remote)\//.test(p) ? "frame-ancestors 'self';" : "frame-ancestors 'none';");
    // Rules by directory: a new docs page or block needs no new rule.
    expect(file.split("\n").filter((l) => l.startsWith("/"))).toEqual(["/*", "/_next/static/*", "/color-scheme.js", "/og/*", "/", "/404", "/blocks", "/blocks/agent-console", "/blocks/usage-limits", "/blocks/view/*", "/charts", "/demo/*", "/docs", "/docs/*", "/micro-frontends"]);
  });

  it("lets hashed build assets, the moved scripts and the share cards included, be cached for good", () => {
    expect(rule(headersFile([]), "/_next/static/*")).toEqual([
      "  ! Cache-Control",
      "  Cache-Control: public, max-age=31536000, immutable",
      "  ! Cross-Origin-Resource-Policy",
      "  Cross-Origin-Resource-Policy: cross-origin",
    ]);
    expect(INLINE_DIR.startsWith("/_next/static/")).toBe(true);
    expect(rule(headersFile([]), "/color-scheme.js")).toEqual(["  ! Cross-Origin-Resource-Policy", "  Cross-Origin-Resource-Policy: cross-origin"]);
    // Share cards are named by a hash of what they show, and loaded by other sites' previews.
    expect(rule(headersFile([]), "/og/*")).toEqual(rule(headersFile([]), "/_next/static/*"));
    expect(policies(headersFile(PAGES), "/og/home-0123456789ab.png")).toEqual([]);
  });

  it("fails the build instead of shipping a file Cloudflare would reject", () => {
    expect(() => headersFile(Array.from({ length: 96 }, (_, i) => `/p${i}`))).not.toThrow();
    expect(() => headersFile(Array.from({ length: 97 }, (_, i) => `/p${i}`))).toThrow("_headers: 101 rules, Cloudflare allows 100");
    expect(() => headersFile([`/${"x".repeat(2000)}`])).toThrow(/characters/);
  });

  it("finds every exported page, nested ones included, at the path Cloudflare serves it", () => {
    const out = mkdtempSync(join(tmpdir(), "out-"));
    mkdirSync(join(out, "docs"));
    for (const f of ["index.html", "docs/a.html", "index.txt"]) writeFileSync(join(out, f), "");
    expect(htmlFiles(out).map((f) => urlPath(out, f)).sort()).toEqual(["/", "/docs/a"]);
    expect(urlPath(out, join(out, "docs", "index.html"))).toBe("/docs/");
  });
});
