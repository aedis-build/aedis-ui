import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";

// #245: a line drawn by the scroll, in a lane the content never enters.
const section = (page: Page) => page.getByRole("main").locator("[data-slot=scroll-path]");
const drawn = (page: Page) => section(page).locator("path").evaluate((p) => 1 - (parseFloat(getComputedStyle(p).strokeDashoffset) || 0));
const settle = (page: Page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
const scrollToShare = (page: Page, share: number) =>
  section(page).evaluate((el, share) => {
    const r = el.getBoundingClientRect();
    // From entry 20% to exit 20% of the section's way through the viewport.
    const start = window.scrollY + r.top - window.innerHeight + 0.2 * Math.min(r.height, window.innerHeight);
    const end = window.scrollY + r.top + Math.max(r.height, window.innerHeight) - window.innerHeight + 0.2 * Math.min(r.height, window.innerHeight);
    window.scrollTo(0, start + share * (end - start));
  }, share);

test("the line draws as the page scrolls, the same natively and in fallback", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/docs/scroll-path");
  const values: Record<string, number[]> = { native: [], fallback: [] };
  for (const mode of ["native", "fallback"] as const) {
    if (mode === "fallback") await page.getByRole("main").getByRole("switch", { name: "JavaScript fallback" }).click();
    await expect(section(page).locator("path")).toHaveAttribute("data-scroll-mode", mode);
    for (const share of [0.1, 0.4, 0.7, 0.95]) {
      for (let i = 0; i < 2; i++) {
        await scrollToShare(page, share);
        await settle(page);
      }
      values[mode]!.push(await drawn(page));
    }
  }
  for (const v of Object.values(values)) for (let i = 1; i < v.length; i++) expect(v[i]!).toBeGreaterThan(v[i - 1]!);
  values.native!.forEach((v, i) => expect(Math.abs(v - values.fallback![i]!)).toBeLessThanOrEqual(0.01));
  expect(values.native![0]!).toBeLessThan(0.3);
  expect(values.native![3]!).toBeGreaterThan(0.8);
});

for (const width of [768, 1440]) {
  test(`at ${width} px the line's box crosses no text, in either lane`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/docs/scroll-path");
    for (const lane of ["left", "right"]) {
      await page.getByRole("main").getByRole("group", { name: "Lane" }).getByRole("button", { name: lane }).click();
      await expect(section(page)).toHaveAttribute("data-lane", lane);
      const crossed = await section(page).evaluate((root) => {
        const line = root.querySelector("svg")!.getBoundingClientRect();
        return [...root.querySelectorAll("p")]
          .map((p) => p.getBoundingClientRect())
          .filter((r) => r.left < line.right && r.right > line.left && r.top < line.bottom && r.bottom > line.top).length;
      });
      expect(crossed).toBe(0);
    }
  });
}

test("with reduced motion, and without JavaScript, the line is fully drawn", async ({ browser }) => {
  const reduced = await browser.newContext({ reducedMotion: "reduce" });
  let page = await reduced.newPage();
  await page.goto("/docs/scroll-path");
  await section(page).scrollIntoViewIfNeeded();
  expect(await drawn(page)).toBe(1);
  await reduced.close();
  const off = await browser.newContext({ javaScriptEnabled: false });
  page = await off.newPage();
  await page.goto("/docs/scroll-path");
  expect(await drawn(page)).toBe(1);
  await expect(section(page).getByText("What we do")).toBeAttached();
  await off.close();
});

test("fits a 390 px screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/scroll-path");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
