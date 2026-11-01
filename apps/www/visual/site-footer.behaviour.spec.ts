import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";

// #247: the curtain footer, in the scrolling box of /docs/site-footer.
const box = (page: Page) => page.getByRole("main").getByRole("group", { name: "A page with a curtain footer" });

/** Of a grid of points over the box's visible area, how many land on the footer. */
const footerPoints = (page: Page) =>
  box(page).evaluate((el) => {
    const r = el.getBoundingClientRect();
    let hits = 0;
    for (let x = 0.1; x < 1; x += 0.2)
      for (let y = 0.05; y < 1; y += 0.1) if (document.elementFromPoint(r.left + x * r.width, r.top + y * r.height)?.closest("footer")) hits++;
    return hits;
  });

test("the footer is fully covered until the end of the page, and fully uncovered there", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/docs/site-footer");
  await box(page).scrollIntoViewIfNeeded();
  await expect(page.getByRole("main").locator("footer[data-reveal]")).toBeAttached();
  // At the top, over the opening section, not one point is footer.
  expect(await footerPoints(page)).toBe(0);
  // Most of the way down, still covered where the page is.
  await box(page).evaluate((el) => (el.scrollTop = (el.scrollHeight - el.clientHeight) * 0.5));
  const half = await box(page).evaluate((el) => {
    const main = el.firstElementChild!.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return document.elementFromPoint(r.left + r.width / 2, Math.min(main.bottom, r.bottom) - 4)?.closest("footer") !== null;
  });
  expect(half).toBe(false);
  // At the end, the footer fills the box.
  await box(page).evaluate((el) => (el.scrollTop = el.scrollHeight));
  expect(await footerPoints(page)).toBe(50);
});

test("its links are reachable by keyboard while it is covered, and come into view", async ({ page }) => {
  await page.goto("/docs/site-footer");
  await box(page).focus();
  const link = box(page).getByRole("link", { name: "Work" });
  for (let i = 0; i < 6 && !(await link.evaluate((el) => el === document.activeElement)); i++) await page.keyboard.press("Tab");
  await expect(link).toBeFocused();
  const visible = await link.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) === el;
  });
  expect(visible).toBe(true);
});

test("with reduced motion it is a normal footer after the page", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/docs/site-footer");
  const footer = box(page).locator("footer");
  await expect(footer).not.toHaveAttribute("data-reveal");
  expect(await footer.evaluate((el) => getComputedStyle(el).position)).toBe("relative");
  await box(page).evaluate((el) => (el.scrollTop = el.scrollHeight));
  await expect(footer.getByText("The next scene could be yours.")).toBeVisible();
});

test("fits a 390 px screen in dark", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/site-footer");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
