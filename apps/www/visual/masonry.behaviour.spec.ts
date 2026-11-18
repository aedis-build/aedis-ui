import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";

// #271: works in mixed ratios in CSS columns on /docs/masonry, interleaved by client, each a link to its file.
const gallery = (page: Page) => page.getByRole("main").getByRole("list", { name: "Work" }).first();
const columnsOf = (page: Page) =>
  gallery(page)
    .getByRole("listitem")
    .evaluateAll((items) => new Set(items.map((i) => Math.round(i.getBoundingClientRect().left))).size);

test("two columns at 390 px, three at 1024, four at 1440, and the page never scrolls sideways", async ({ page }) => {
  for (const [width, columns] of [[390, 2], [1024, 3], [1440, 4]] as const) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/docs/masonry");
    await expect.poll(() => columnsOf(page), `at ${width} px`).toBe(columns);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
});

test("each tile keeps its own ratio and is never split across columns", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/docs/masonry");
  const boxes = await gallery(page)
    .locator("[data-slot=media-frame]")
    .evaluateAll((frames) => frames.map((f) => ({ ratio: f.getAttribute("data-ratio"), rects: f.getClientRects().length, ...f.getBoundingClientRect().toJSON() })));
  const shape = { "2:3": 2 / 3, "9:16": 9 / 16, "4:5": 4 / 5, "1:1": 1, "3:2": 3 / 2, "16:9": 16 / 9 } as Record<string, number>;
  for (const b of boxes) {
    expect(b.rects).toBe(1);
    expect(b.width / b.height).toBeCloseTo(shape[b.ratio!]!, 1);
  }
});

test("Tab walks the links in DOM order, down a column then the next, and interleaving mixes the clients", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/docs/masonry");
  const links = gallery(page).getByRole("link");
  const names = await links.evaluateAll((as) => as.map((a) => a.querySelector("img")!.alt));
  expect(names.slice(0, 4).map((n) => n.split(",")[0])).toEqual(["Ceramics studio", "Garden centre", "Bakery", "Hotel"]);
  await links.first().focus();
  for (const name of names.slice(1, 4)) {
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name })).toBeFocused();
  }
  await page.getByRole("main").getByRole("switch", { name: "Interleave by client" }).click();
  await expect(links.nth(1)).toHaveAccessibleName("Ceramics studio, the mug stamp");
});

test("a tile is a plain link to its file, so it opens without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/docs/masonry");
  const link = gallery(page).getByRole("link", { name: "Garden centre, the greenhouse door" });
  await expect(link).toHaveAttribute("href", "/media/work-2.svg");
  await link.click();
  await expect(page).toHaveURL(/\/media\/work-2\.svg$/);
  await context.close();
});
