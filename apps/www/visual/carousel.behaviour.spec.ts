import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";

// #192: a gallery moved by hand, and a slideshow that plays on its own only as the person allows.

const live = (page: Page, name: string) => page.getByRole("region", { name }).first().locator("[aria-roledescription=slide]:not([inert])");

test("next and previous move the gallery and bring the new slide into view", async ({ page }) => {
  await page.goto("/docs/carousel");
  const gallery = page.getByRole("region", { name: "Selected work" }).first();
  await expect(live(page, "Selected work").first()).toHaveAttribute("aria-label", "1 of 4");
  await gallery.getByRole("button", { name: "Next slide" }).click();
  await expect(gallery.getByRole("group", { name: "2 of 4" })).not.toHaveAttribute("inert");
  await expect(gallery.getByRole("group", { name: "1 of 4" })).toHaveAttribute("inert");
  await gallery.getByRole("button", { name: "Previous slide" }).press("Enter");
  await expect(gallery.getByRole("group", { name: "1 of 4" })).not.toHaveAttribute("inert");
});

test("the gallery has no autoplay unless asked: nothing moves on its own", async ({ page }) => {
  await page.goto("/docs/carousel");
  const gallery = page.getByRole("region", { name: "Selected work" }).first();
  await expect(gallery.getByRole("button", { name: "Pause" })).toHaveCount(0);
  await page.waitForTimeout(5500);
  await expect(gallery.getByRole("group", { name: "1 of 4" })).not.toHaveAttribute("inert");
});

test("the slideshow plays, Pause comes first and stops it, and hovering holds it", async ({ page }) => {
  await page.goto("/docs/carousel");
  const show = page.getByRole("region", { name: "Showreel" }).first();
  await show.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  await expect(live(page, "Showreel")).toHaveAttribute("aria-label", "2 of 3", { timeout: 6000 });

  await show.hover();
  await page.waitForTimeout(4500);
  await expect(live(page, "Showreel")).toHaveAttribute("aria-label", "2 of 3");

  const pause = show.getByRole("button", { name: "Pause" });
  await pause.click();
  await expect(show.getByRole("button", { name: "Play" })).toBeVisible();
  await page.mouse.move(0, 0);
  await page.locator("body").click({ position: { x: 1, y: 1 } });
  await page.waitForTimeout(4500);
  await expect(live(page, "Showreel")).toHaveAttribute("aria-label", "2 of 3");
});

test("a swipe on touch moves the slideshow", async ({ page }) => {
  await page.goto("/docs/carousel");
  const stage = page.getByRole("region", { name: "Showreel" }).first().locator(".touch-pan-y");
  await stage.scrollIntoViewIfNeeded();
  await stage.dispatchEvent("pointerdown", { pointerType: "touch", clientX: 300, isPrimary: true });
  await stage.dispatchEvent("pointerup", { pointerType: "touch", clientX: 150, isPrimary: true });
  await expect(live(page, "Showreel")).toHaveAttribute("aria-label", "2 of 3");
});

test("with reduced motion nothing plays and there is no pause button", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/docs/carousel");
  const show = page.getByRole("region", { name: "Showreel" }).first();
  await expect(show.getByRole("button", { name: "Pause" })).toHaveCount(0);
  await page.waitForTimeout(5000);
  await expect(live(page, "Showreel")).toHaveAttribute("aria-label", "1 of 3");
});

test("both fit a 390 px screen in dark", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/carousel");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  const next = page.getByRole("region", { name: "Selected work" }).first().getByRole("button", { name: "Next slide" });
  const box = (await next.boundingBox())!;
  expect(box.x + box.width).toBeLessThanOrEqual(390);
});
