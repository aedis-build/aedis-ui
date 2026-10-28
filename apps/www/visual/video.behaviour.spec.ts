import { expect, test } from "./fixtures";

// #193: a showreel the person plays, and a background loop that always offers a pause.

const playing = (video: import("@playwright/test").Locator) => video.evaluate((v: HTMLVideoElement) => !v.paused && v.currentTime > 0);

test("the player waits to be played, loads its file with preload none, and carries captions", async ({ page }) => {
  const fetched: string[] = [];
  page.on("request", (r) => r.url().endsWith(".webm") && fetched.push(r.url()));
  await page.goto("/docs/video");
  const player = page.getByRole("main").locator("video[aria-label='Studio showreel']").first();
  await expect(player).toHaveAttribute("preload", "none");
  await player.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  expect(await player.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
  await expect(player.locator("source")).toHaveAttribute("src", "/media/showreel.webm");
  await expect(player.locator("track[kind=captions]")).toHaveAttribute("srclang", "en");
  await player.evaluate((v: HTMLVideoElement) => v.play());
  await expect.poll(() => playing(player)).toBe(true);
  expect(fetched.length).toBeGreaterThan(0);
});

test("the background video plays muted and its pause button stops it, with the keyboard", async ({ page }) => {
  await page.goto("/docs/video");
  const loop = page.getByRole("main").locator("[data-variant=background] video").first();
  await loop.scrollIntoViewIfNeeded();
  await expect.poll(() => playing(loop)).toBe(true);
  expect(await loop.evaluate((v: HTMLVideoElement) => v.muted)).toBe(true);
  await expect(loop).toHaveAttribute("aria-hidden", "true");
  const pause = page.getByRole("main").getByRole("button", { name: "Pause video" }).first();
  await pause.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main").getByRole("button", { name: "Play video" }).first()).toBeVisible();
  expect(await loop.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
});

test("with reduced motion the background video stays on its poster until played", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/docs/video");
  const loop = page.getByRole("main").locator("[data-variant=background] video").first();
  await loop.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  expect(await loop.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
  await page.getByRole("main").getByRole("button", { name: "Play video" }).first().click();
  await expect.poll(() => playing(loop)).toBe(true);
});

test("both fit a 390 px screen in dark", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/video");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
