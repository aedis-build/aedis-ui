import { expect, test } from "./fixtures";

// #280: key numbers in a hairline row, two columns on a phone, and a link that reads and acts like one.

const tops = (group: import("@playwright/test").Locator) =>
  group.locator("[data-slot=stat]").evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));

test("at 1440 px the Identity stats sit in one row, label above a tabular value", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/docs/stat");
  const group = page.getByRole("main").locator("dl[aria-label=Identity]").first();
  await expect(group).toContainText("12,480");
  expect(new Set(await tops(group)).size).toBe(1);
  const first = group.locator("[data-slot=stat]").first();
  const label = (await first.locator("dt").boundingBox())!;
  const value = first.locator("dd").first();
  expect((await value.boundingBox())!.y).toBeGreaterThan(label.y);
  expect(await value.evaluate((e) => getComputedStyle(e).fontVariantNumeric)).toContain("tabular-nums");
});

test("the approvals link takes the keyboard, is at least 24 px tall and opens its page", async ({ page }) => {
  await page.goto("/docs/stat");
  const link = page.getByRole("main").locator("dl[aria-label=Identity]").first().getByRole("link", { name: "Review approvals" });
  await link.focus();
  await expect(link).toBeFocused();
  expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(24);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/docs\/approval-card/);
});

test("the billing stat says value of total and keeps its bar out of the accessibility tree", async ({ page }) => {
  await page.goto("/docs/stat");
  const group = page.getByRole("main").locator("dl[aria-label=Billing]").first();
  await expect(group).toContainText("13,041 of 50,000");
  await expect(group.getByRole("progressbar")).toHaveCount(0);
  await expect(group.locator("[data-slot=progress]")).toBeVisible();
});

test("at 390 px in dark the row folds into two columns without scrolling sideways", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/stat");
  const group = page.getByRole("main").locator("dl[aria-label=Identity]").first();
  await expect(group).toBeVisible();
  const [a, b, c, d] = await tops(group);
  expect(a).toBe(b);
  expect(c).toBe(d);
  expect(c).toBeGreaterThan(a!);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
