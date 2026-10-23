import { expect, test } from "@playwright/test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** Every exported page sends the share tags, and its og:image is a 1200×630 PNG in the export (#141). */
const out = join(process.cwd(), "out");
// Frame-only pages and the error pages are not meant to be shared.
const skip = /^\/(?:blocks\/view\/|demo\/remote\/|404$|_not-found$)/;
const pages = readdirSync(out, { recursive: true, withFileTypes: true })
  .filter((e) => e.isFile() && e.name.endsWith(".html"))
  .map((e) => `/${join(e.parentPath, e.name).slice(out.length + 1).replaceAll("\\", "/")}`.replace(/\.html$/, "").replace(/(^|\/)index$/, "$1"))
  .filter((p) => !skip.test(p));

const meta = (html: string, key: string) => new RegExp(`<meta (?:property|name)="${key}" content="([^"]*)"`).exec(html)?.[1];

test("every page has its share card and every tag a link preview reads", () => {
  expect(pages.length).toBeGreaterThan(80);
  for (const path of pages) {
    const html = readFileSync(join(out, path === "/" ? "index.html" : `${path}.html`), "utf8");
    const url = `https://ui.aedis.build${path}`;
    expect(html, path).toContain(`<link rel="canonical" href="${url}"/>`);
    expect(meta(html, "og:url"), path).toBe(url);
    for (const key of ["og:title", "og:description", "og:site_name", "og:type", "og:image:alt", "twitter:title", "twitter:description"]) expect(meta(html, key), `${path} ${key}`).toBeTruthy();
    expect([meta(html, "og:image:width"), meta(html, "og:image:height"), meta(html, "twitter:card")], path).toEqual(["1200", "630", "summary_large_image"]);
    const image = meta(html, "og:image")!;
    expect(meta(html, "twitter:image"), path).toBe(image);
    expect(image, path).toMatch(/^https:\/\/ui\.aedis\.build\/og\/[a-z0-9-]+-[0-9a-f]{12}\.png$/);
    const file = join(out, new URL(image).pathname);
    expect(existsSync(file), `${path}: ${image}`).toBe(true);
    const png = readFileSync(file);
    expect([png.readUInt32BE(16), png.readUInt32BE(20)], image).toEqual([1200, 630]);
  }
});
