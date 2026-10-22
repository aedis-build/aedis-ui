import { createHash } from "node:crypto";
import fc from "fast-check";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { headersFile, htmlFiles, inlineScriptHashes, urlPath } from "@/scripts/headers";

const sha = (s: string) => `sha256-${createHash("sha256").update(s, "utf8").digest("base64")}`;

/** The header lines of the rule for `path`. */
const rule = (file: string, path: string) => {
  const lines = file.split("\n");
  const start = lines.indexOf(path) + 1;
  const end = lines.findIndex((l, i) => i >= start && !l.startsWith("  "));
  return lines.slice(start, end);
};

describe("_headers", () => {
  it("hashes inline scripts only, over their exact text", () => {
    const html = `<script src="/a.js" async=""></script><script>self.__next_f.push([1,"x"])</script><script nonce="n">\n a()\n</script>`;
    expect(inlineScriptHashes(html)).toEqual([sha('self.__next_f.push([1,"x"])'), sha("\n a()\n")]);
  });

  it("sends every security header on every path, with the 404 page's policy for unknown ones", () => {
    const all = rule(headersFile("<script>nf()</script>", []), "/*");
    expect(all).toEqual(
      expect.arrayContaining([
        "  X-Frame-Options: DENY",
        "  Cross-Origin-Opener-Policy: same-origin",
        "  Cross-Origin-Resource-Policy: same-origin",
        "  Referrer-Policy: strict-origin-when-cross-origin",
        "  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()",
        "  X-Content-Type-Options: nosniff",
        "  Cache-Control: no-store",
      ]),
    );
    expect(all.some((l) => l.startsWith("  Strict-Transport-Security: "))).toBe(true);
    const csp = all.filter((l) => l.startsWith("  Content-Security-Policy: "));
    expect(csp).toHaveLength(1);
    expect(csp[0]).toContain(`script-src 'self' '${sha("nf()")}';`);
    expect(csp[0]).toContain("frame-ancestors 'none'");
    expect(csp[0]).not.toMatch(/script-src[^;]*unsafe-inline/);
  });

  it("gives each page its own policy with its hashes, once each, replacing the default one", () => {
    const file = headersFile("", [["/", "<script>a()</script><script>a()</script><script>b()</script>"], ["/docs/x", "<script>c()</script>"]]);
    const [detach, csp] = rule(file, "/");
    expect(detach).toBe("  ! Content-Security-Policy");
    expect(csp).toContain(`script-src 'self' '${[sha("a()"), sha("b()")].sort().join("' '")}';`);
    expect(rule(file, "/docs/x")[1]).toContain(`script-src 'self' '${sha("c()")}';`);
  });

  it("lets hashed build assets be cached for good", () => {
    expect(rule(headersFile("", []), "/_next/static/*")).toEqual(["  ! Cache-Control", "  Cache-Control: public, max-age=31536000, immutable"]);
  });

  it("fails the build instead of shipping a file Cloudflare would reject", () => {
    expect(() => headersFile("", Array.from({ length: 99 }, (_, i): [string, string] => [`/p${i}`, ""]))).toThrow(/rules/);
    const many = Array.from({ length: 40 }, (_, i) => `<script>${i}</script>`).join("");
    expect(() => headersFile("", [["/", many]])).toThrow(/characters/);
  });

  it("finds every exported page, nested ones included, at the path Cloudflare serves it", () => {
    const out = mkdtempSync(join(tmpdir(), "out-"));
    mkdirSync(join(out, "docs"));
    for (const f of ["index.html", "docs/a.html", "index.txt"]) writeFileSync(join(out, f), "");
    expect(htmlFiles(out).map((f) => urlPath(out, f)).sort()).toEqual(["/", "/docs/a"]);
    expect(urlPath(out, join(out, "docs", "index.html"))).toBe("/docs/");
  });

  it("hashes exactly the inline scripts of any page, whatever surrounds them", () => {
    const text = fc.string().filter((s) => !s.toLowerCase().includes("</script"));
    fc.assert(
      fc.property(fc.array(fc.tuple(text, fc.boolean())), text, (scripts, filler) => {
        const html = scripts.map(([body, external]) => (external ? `<script src="/x.js">${body}</script>` : `<script>${body}</script>`)).join(filler.replaceAll("<", ""));
        expect(inlineScriptHashes(html)).toEqual(scripts.filter(([, external]) => !external).map(([body]) => sha(body)));
      }),
    );
  });
});
