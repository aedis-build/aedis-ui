// Page screenshots for a pull request (#118): each path in light and dark, at 1440 px and 390 px, full page, so the
// maintainer can hold them against the canvas board. Needs the static export (pnpm build) and the browsers from
// `npx playwright install chromium`. Usage: pnpm capture / /charts  →  visual/captures/charts-dark-390.png …
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { chromium } from "@playwright/test";

const paths = process.argv.slice(2);
if (!paths.length) throw new Error("usage: pnpm capture <path>…");
const dir = fileURLToPath(new URL("captures/", import.meta.url));
mkdirSync(dir, { recursive: true });

await import("./serve.mjs");
const browser = await chromium.launch();
for (const scheme of ["light", "dark"]) {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme: scheme, deviceScaleFactor: 1 });
    for (const path of paths) {
      await page.goto(`http://127.0.0.1:4173${path}`, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      const name = path === "/" ? "home" : path.slice(1).replace(/\//g, "-");
      await page.screenshot({ path: `${dir}${name}-${scheme}-${width}.png`, fullPage: true, animations: "disabled" });
    }
    await page.close();
  }
}
await browser.close();
process.exit(0);
