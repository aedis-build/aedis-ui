import { createRequire } from "node:module";

import { expect, test } from "./fixtures";

// #239: the axe rules Lighthouse failed on the showcase, checked on the built pages with real layout. A full WCAG A/AA
// gate finds more (code-block scroll regions, unnamed toggles): follow-ups, not this issue.
const RULES = ["label-content-name-mismatch", "heading-order", "link-in-text-block"];
const axePath = createRequire(import.meta.url).resolve("axe-core/axe.min.js");
test.use({ bypassCSP: true });

for (const path of ["/", "/security", "/docs", "/docs/card", "/blocks/usage-limits"]) {
  test(`${path} names links by their text, skips no heading level and underlines links in text`, async ({ page }) => {
    await page.goto(path);
    await page.addScriptTag({ path: axePath });
    const found = await page.evaluate(async (rules) => {
      const axe = (window as unknown as { axe: { run: (c: unknown, o: unknown) => Promise<{ violations: { id: string; nodes: { target: string[] }[] }[] }> } }).axe;
      const r = await axe.run(document, { runOnly: { type: "rule", values: rules } });
      return r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
    }, RULES);
    expect(found).toEqual([]);
  });
}
