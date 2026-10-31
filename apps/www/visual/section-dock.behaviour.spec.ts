import { createRequire } from "node:module";

import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";

test.use({ bypassCSP: true });

// #246: the ring follows the chapters of /docs/section-dock, including the sticky one.
const dock = (page: Page) => page.getByRole("navigation", { name: "Page sections" });
const ring = (page: Page) => dock(page).getByRole("button");
const settle = (page: Page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
/** Scrolls so that the reading head (half the viewport) is `px` into a chapter. */
const into = async (page: Page, id: string, px: number) => {
  for (let i = 0; i < 2; i++) {
    await page.evaluate(([id, px]) => window.scrollTo(0, document.getElementById(id as string)!.getBoundingClientRect().top + window.scrollY + (px as number) - window.innerHeight / 2), [id, px]);
    await settle(page);
  }
};

test("names the current chapter at five positions, including deep inside the sticky scene", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/docs/section-dock");
  for (const [id, px, name] of [
    ["dock-opening", 50, "Opening"],
    ["dock-work", 300, "Work"],
    ["dock-house", 100, "The house"],
    // The scene is sticky for 1.5 screens: its own chapter until it ends, then the next.
    ["dock-house", 1500, "The house"],
    ["dock-services", 20, "Services"],
  ] as const) {
    await into(page, id, px);
    await expect(ring(page)).toHaveAccessibleName(`Page sections, now: ${name}`);
  }
  const offset = await dock(page).locator("[data-slot=section-dock-ring]").evaluate((c) => parseFloat(getComputedStyle(c).strokeDashoffset));
  const progress = await page.evaluate(() => window.scrollY / (document.documentElement.scrollHeight - window.innerHeight));
  expect(Math.abs(1 - offset - progress)).toBeLessThan(0.01);
});

test("opens on hover and keyboard focus, lists the chapters by state, and Escape closes it", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/docs/section-dock");
  await into(page, "dock-house", 100);
  await ring(page).hover();
  await expect(ring(page)).toHaveAttribute("aria-expanded", "true");
  await expect(dock(page).getByRole("link", { name: "The house, you are here" })).toHaveAttribute("aria-current", "location");
  await expect(dock(page).getByRole("link", { name: "Opening, read" })).toBeVisible();
  await expect(dock(page).getByRole("link", { name: "Contact, next" })).toBeVisible();
  await page.mouse.move(0, 0);
  await expect(dock(page).getByRole("link")).toHaveCount(0);

  await ring(page).focus();
  await expect(ring(page)).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Tab");
  await expect(dock(page).getByRole("link", { name: "Opening, read" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dock(page).getByRole("link")).toHaveCount(0);
  await expect(ring(page)).toBeFocused();
});

test("a tap opens it on a phone, and the panel fits the screen", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await page.goto("/docs/section-dock");
  await into(page, "dock-work", 100);
  await ring(page).tap();
  const panel = dock(page).locator("[data-slot=section-dock-panel]");
  await expect(panel).toBeVisible();
  const box = (await panel.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(12);
  expect(box.x + box.width).toBeLessThanOrEqual(390 - 12);
  await context.close();
});

test("the closed dock covers no text of the demo on a 390 px screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/section-dock");
  for (const [id, px] of [["dock-opening", 0], ["dock-work", 200], ["dock-house", 600], ["dock-services", 300], ["dock-contact", 100]] as const) {
    await into(page, id, px);
    const covered = await page.evaluate(() => {
      const d = document.querySelector("[data-slot=section-dock]")!.getBoundingClientRect();
      return [...document.querySelectorAll("[data-chapter] p")]
        .map((p) => p.getBoundingClientRect())
        .filter((r) => r.left < d.right && r.right > d.left && r.top < d.bottom && r.bottom > d.top).length;
    });
    expect(covered, `at ${id} + ${px}`).toBe(0);
  }
});

test("axe finds no violation with the dock open, and reduced motion opens it without the pop", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/docs/section-dock", { waitUntil: "networkidle" });
  await into(page, "dock-work", 100);
  await ring(page).focus();
  const panel = dock(page).locator("[data-slot=section-dock-panel]");
  await expect(panel).toBeVisible();
  expect(await panel.evaluate((el) => getComputedStyle(el).transitionProperty)).toBe("none");
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve("axe-core/axe.min.js") });
  const found = await dock(page).evaluate(async (el) => {
    const axe = (window as unknown as { axe: { run: (c: unknown, o: unknown) => Promise<{ violations: { id: string }[] }> } }).axe;
    return (await axe.run(el, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } })).violations.map((v) => v.id);
  });
  expect(found).toEqual([]);
});
