import { expect, test } from "@playwright/test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** robots.txt, sitemap.xml, the llms.txt link and the JSON-LD, as the export ships them (#142). */
const out = join(process.cwd(), "out");
const frameOnly = /^\/(?:blocks\/view\/|demo\/remote\/|404$|_not-found$)/;
const pages = readdirSync(out, { recursive: true, withFileTypes: true })
  .filter((e) => e.isFile() && e.name.endsWith(".html"))
  .map((e) => `/${join(e.parentPath, e.name).slice(out.length + 1).replaceAll("\\", "/")}`.replace(/\.html$/, "").replace(/(^|\/)index$/, "$1"));
const html = (path: string) => readFileSync(join(out, path === "/" ? "index.html" : `${path}.html`), "utf8");

test("robots.txt carries the content signals and the sitemap, and blocks no crawler", () => {
  const robots = readFileSync(join(out, "robots.txt"), "utf8");
  expect(robots).toContain("User-agent: *\nContent-Signal: search=yes, ai-input=yes, ai-train=yes\nAllow: /\n");
  expect(robots).toContain("Sitemap: https://ui.aedis.build/sitemap.xml");
  expect(robots).not.toMatch(/^Disallow/im);
});

test("every exported page is in sitemap.xml, and nothing that is not a page", () => {
  const xml = readFileSync(join(out, "sitemap.xml"), "utf8");
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).sort();
  const shared = pages.filter((p) => !frameOnly.test(p)).map((p) => `https://ui.aedis.build${p}`).sort();
  expect(urls).toEqual(shared);
  expect(xml).toMatch(/<lastmod>\d{4}-\d\d-\d\dT/);
});

test("every page links llms.txt in its head, and carries valid JSON-LD", () => {
  for (const path of pages.filter((p) => !frameOnly.test(p))) {
    const page = html(path);
    const head = page.slice(0, page.indexOf("</head>"));
    const link = /<link rel="alternate" type="text\/plain"[^>]*>/.exec(head)?.[0] ?? "";
    expect(link, path).toContain('href="https://ui.aedis.build/llms.txt"');
    expect(link, path).toContain('title="llms.txt"');
    const blocks = [...page.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]) as { "@context": string; "@graph": { "@type": string; url?: string }[] });
    expect(blocks, path).toHaveLength(1);
    expect(blocks[0]["@context"]).toBe("https://schema.org");
    expect(blocks[0]["@graph"].map((n) => n["@type"]), path).toEqual(["WebSite", "SoftwareSourceCode", path.startsWith("/docs/") ? "TechArticle" : "WebPage"]);
  }
});
