import { expect, test } from "./fixtures";

// #194: thumbnails that keep their shape, and a placeholder that says what is missing.

test("frames keep their 4:5 shape before and after the images load", async ({ page }) => {
  await page.route("**/media/*.svg", async (route) => {
    await new Promise((r) => setTimeout(r, 400));
    await route.continue();
  });
  await page.goto("/docs/media-frame");
  const frames = page.getByRole("main").locator("[data-slot=media-frame]");
  const before = (await frames.first().boundingBox())!;
  expect(before.height / before.width).toBeCloseTo(5 / 4, 1);
  await expect(page.getByRole("main").getByRole("img", { name: "Ceramics studio identity, the shop sign" })).toBeVisible();
  await page.waitForFunction(() => [...document.querySelectorAll("main [data-slot=media-frame] img")].every((i) => (i as HTMLImageElement).complete));
  const after = (await frames.first().boundingBox())!;
  expect(after.height).toBeCloseTo(before.height, 0);
});

test("a frame without media is announced by its alt and caption", async ({ page }) => {
  await page.goto("/docs/media-frame");
  await expect(page.getByRole("main").getByRole("img", { name: "Hotel campaign: Photos coming soon" }).first()).toBeVisible();
});

test("an image that fails to load falls back to the placeholder", async ({ page }) => {
  await page.route("**/media/work-1.svg", (route) => route.fulfill({ status: 404 }));
  await page.goto("/docs/media-frame");
  const missing = page.getByRole("main").getByRole("img", { name: "Ceramics studio identity, the shop sign" }).first();
  await expect(missing).toHaveAttribute("data-slot", "media-frame-placeholder");
});

test("the grid fits a 390 px screen in dark, frames still 4:5", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/media-frame");
  const box = (await page.getByRole("main").locator("[data-slot=media-frame]").first().boundingBox())!;
  expect(box.height / box.width).toBeCloseTo(5 / 4, 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
