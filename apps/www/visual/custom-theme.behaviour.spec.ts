import { expect, test } from "./fixtures";

// #202: a theme's fonts chosen as a person would, through the same validator as `aedis theme import`.

test("a display preset sets --font-display and the heading follows it", async ({ page }) => {
  await page.goto("/docs/custom-theme");
  const main = page.getByRole("main");
  const vars = main.getByRole("status", { name: "Theme fonts" });
  await expect(vars).toContainText("--font-display: ui-serif");
  const heading = main.getByRole("heading", { name: "Selected work" });
  expect(await heading.evaluate((el) => getComputedStyle(el).fontFamily)).toMatch(/^ui-serif/);

  await main.getByRole("combobox", { name: "Display preset" }).click();
  await page.getByRole("option", { name: "rounded" }).click();
  await expect(vars).toContainText("--font-display: ui-rounded");
  expect(await heading.evaluate((el) => getComputedStyle(el).fontFamily)).toMatch(/^ui-rounded/);
});

test("a self-hosted family is quoted ahead of the fallback, and anything else is refused", async ({ page }) => {
  await page.goto("/docs/custom-theme");
  const main = page.getByRole("main");
  const family = main.getByRole("textbox", { name: "Self-hosted display family" });
  await family.fill("Fraunces");
  await expect(main.getByRole("status", { name: "Theme fonts" })).toContainText('--font-display: "Fraunces", -apple-system');
  await family.fill('X"; } body { color: red');
  await expect(main.getByRole("status", { name: "Theme fonts" })).toContainText("fonts.display must be one of");
});

test("the site's own headings take the display font token", async ({ page }) => {
  await page.goto("/docs/custom-theme");
  const [h1, display] = await page.evaluate(() => [getComputedStyle(document.querySelector("h1")!).fontFamily, getComputedStyle(document.documentElement).getPropertyValue("--font-display").trim()]);
  // Unthemed, the display font is the sans.
  expect(display).toContain("-apple-system");
  expect(h1).toContain("-apple-system");
});

test("fits a 390 px screen in dark", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/custom-theme");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
