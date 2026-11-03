import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";

// #242: the corridor on /docs/image-stream, under the site's strict CSP (no bypass here).
const stream = (page: Page) => page.getByRole("main").locator("[data-slot=image-stream]");

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { csp: string[] }).csp = [];
    document.addEventListener("securitypolicyviolation", (e) => (window as unknown as { csp: string[] }).csp.push(`${e.violatedDirective} ${e.blockedURI}`));
  });
});

test("runs under the strict CSP of security-headers, with every card moving and none refused", async ({ page }) => {
  const response = await page.goto("/docs/image-stream");
  expect(response!.headers()["content-security-policy"]).toContain("style-src-elem 'self'");
  await stream(page).scrollIntoViewIfNeeded();
  await expect.poll(() => stream(page).evaluate((el) => el.getAnimations({ subtree: true }).filter((a) => a.playState === "running").length)).toBe(14);
  expect(await page.evaluate(() => (window as unknown as { csp: string[] }).csp)).toEqual([]);
});

test("the vanishing point is always covered, at 20 instants", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/docs/image-stream");
  await stream(page).scrollIntoViewIfNeeded();
  for (let i = 0; i < 20; i++) {
    const hit = await stream(page).evaluate((el) => {
      const r = el.getBoundingClientRect();
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return Boolean(top?.closest("[data-slot=image-stream-card], [data-slot=image-stream-centre]"));
    });
    expect(hit, `instant ${i}`).toBe(true);
    await page.waitForTimeout(170);
  }
});

test("no card's inner edge is inside the frame when it dies", async ({ page }) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/docs/image-stream");
    // The animations start after hydration: wait for all of them before stopping each at its end.
    await expect.poll(() => stream(page).evaluate((el) => el.getAnimations({ subtree: true }).length)).toBe(14);
    const edges = await stream(page).evaluate((el) => {
      const frame = el.getBoundingClientRect();
      return [...el.querySelectorAll<HTMLElement>("[data-slot=image-stream-card]")].map((card) => {
        const a = card.getAnimations()[0]!;
        a.pause();
        a.currentTime = Number(a.effect!.getTiming().duration) - 1;
        const r = card.getBoundingClientRect();
        return card.dataset.side === "1" ? r.left - frame.right : frame.left - r.right;
      });
    });
    for (const gap of edges) expect(gap, `at ${width} px`).toBeGreaterThanOrEqual(0);
  }
});

test("with reduced motion it is a still: every card stays where it is, mid-flight", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/docs/image-stream");
  expect(await stream(page).evaluate((el) => el.getAnimations({ subtree: true }).length)).toBe(0);
  const scales = await stream(page).locator("[data-slot=image-stream-card]").evaluateAll((cards) => cards.map((c) => new DOMMatrix(getComputedStyle(c).transform).a));
  expect(new Set(scales.map((s) => s.toFixed(3))).size).toBeGreaterThan(5);
});

test("the path knobs change the corridor, and the page fits 390 px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/image-stream");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  const fan = page.getByRole("main").getByRole("slider", { name: /Fan/ });
  await fan.focus();
  await page.keyboard.press("End");
  await expect(page.getByRole("main").getByText(/^Fan: 4/)).toBeVisible();
});
