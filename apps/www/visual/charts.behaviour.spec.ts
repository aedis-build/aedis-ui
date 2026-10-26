import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";

// #159: charts and data display as a person sees them. Each check failed on main at 41d5382.

/** Boxes of the x labels that are shown, and of the chart they belong to. */
const ticks = (page: Page) =>
  page.locator("main [data-slot=chart-ticks]").evaluateAll((all) =>
    all.map((el) => ({
      chart: el.getBoundingClientRect().toJSON() as DOMRect,
      total: el.children.length,
      shown: [...el.children].filter((s) => getComputedStyle(s).visibility !== "hidden").map((s) => s.getBoundingClientRect().toJSON() as DOMRect),
    })),
  );

test("the pie's slices stay put across hovers, and the tooltip names the slice under the pointer", async ({ page }) => {
  await page.goto("/docs/pie-chart");
  const slices = page.locator("main [data-slot=chart] circle[data-enter]");
  const offsets = () => slices.evaluateAll((all) => all.map((c) => c.getAttribute("stroke-dashoffset")));
  const before = await offsets();
  for (let round = 0; round < 3; round++) for (const slice of await slices.all()) await slice.dispatchEvent("pointerover");
  expect(await offsets()).toEqual(before);
  await slices.nth(1).dispatchEvent("pointerover");
  const second = await page.locator("main [data-slot=chart] li").nth(1).innerText();
  await expect(page.locator("main [data-slot=chart-tooltip]").first()).toContainText(second);
});

test("the enter animation runs for its token's length in ms, not 0.56 ms, and the stagger is capped", async ({ page }) => {
  await page.addInitScript(() => {
    const animate = Element.prototype.animate;
    const seen: { duration: number; delay: number }[] = ((window as unknown as { seen: typeof seen }).seen = []);
    Element.prototype.animate = function (frames, options) {
      if (typeof options === "object") seen.push({ duration: Number(options.duration), delay: options.delay ?? 0 });
      return animate.call(this, frames, options);
    };
  });
  await page.goto("/docs/bar-chart");
  await page.waitForTimeout(300);
  const seen = await page.evaluate(() => (window as unknown as { seen: { duration: number; delay: number }[] }).seen);
  const durations = seen.map((s) => s.duration);
  expect(durations.length).toBeGreaterThan(30);
  // The 30-row example: its whole stagger stays within 600 ms.
  expect(Math.max(...seen.map((s) => s.delay))).toBeLessThanOrEqual(600);
  expect(Math.min(...durations)).toBeGreaterThanOrEqual(100);
});

test("under reduced motion, no chart animation starts, not even at hydration", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    const animate = Element.prototype.animate;
    (window as unknown as { started: number }).started = 0;
    Element.prototype.animate = function (...args) {
      (window as unknown as { started: number }).started++;
      return animate.apply(this, args);
    };
  });
  await page.goto("/charts");
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => (window as unknown as { started: number }).started)).toBe(0);
});

for (const width of [1440, 390]) {
  test(`x labels never overlap and stay inside their chart at ${width} px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/docs/bar-chart");
    await page.waitForTimeout(300);
    const all = await ticks(page);
    // The 30-row example has to leave labels out to keep them apart.
    expect(all.some(({ shown, total }) => total === 30 && shown.length > 3 && shown.length < total)).toBe(true);
    expect(all.length).toBeGreaterThan(0);
    for (const { chart, shown } of all) {
      for (const s of shown) {
        expect(s.left).toBeGreaterThanOrEqual(chart.left - 0.5);
        expect(s.right).toBeLessThanOrEqual(chart.right + 0.5);
      }
      for (let i = 1; i < shown.length; i++) expect(shown[i].left).toBeGreaterThanOrEqual(shown[i - 1].right);
    }
  });
}

test("data display demos: skeleton has width, indeterminate progress is not 0 %, alert shows its four variants", async ({ page }) => {
  await page.goto("/docs/skeleton");
  expect((await page.locator("main [data-slot=skeleton]").first().boundingBox())!.width).toBeGreaterThan(100);

  await page.goto("/docs/progress");
  const unknown = page.getByRole("progressbar", { name: "Indexing the knowledge base" });
  const indicator = unknown.locator("[data-slot=progress-indicator]");
  const [bar, fill] = [(await unknown.boundingBox())!, (await indicator.boundingBox())!];
  // Something is drawn across the track, unlike 0 %, which draws nothing.
  expect(fill.x + fill.width).toBeGreaterThan(bar.x + bar.width / 2);
  expect(await indicator.evaluate((el) => getComputedStyle(el).backgroundImage)).toContain("repeating-linear-gradient");

  await page.goto("/docs/alert");
  const variants = await page.locator("main [data-slot=alert]").evaluateAll((all) => [...new Set(all.map((a) => a.getAttribute("data-variant")))]);
  expect(variants.sort()).toEqual(["default", "destructive", "success", "warning"]);
});
