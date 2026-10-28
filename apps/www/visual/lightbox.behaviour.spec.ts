import { expect, test } from "./fixtures";

// #195: opening a work full screen and moving through the group, with the mouse and the keyboard.

test("a click opens the work as a dialog named by its title; arrows move; Esc returns to the thumbnail", async ({ page }) => {
  await page.goto("/docs/lightbox");
  const thumb = page.getByRole("main").getByRole("button", { name: "Green signage by the greenhouse door" }).first();
  await thumb.click();
  const dialog = page.getByRole("dialog", { name: "Garden centre" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("2 of 4");
  await expect(dialog).toContainText("Wayfinding, 2025");
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("dialog", { name: "Bakery website" })).toContainText("3 of 4");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByRole("dialog", { name: "Hotel campaign" })).toContainText("4 of 4");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(thumb).toBeFocused();
});

test("the keyboard opens it, Tab stays inside, and the buttons move and close", async ({ page }) => {
  await page.goto("/docs/lightbox");
  await page.getByRole("main").getByRole("button", { name: "Shop sign in terracotta and cream" }).first().focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);
  }
  await dialog.getByRole("button", { name: "Next" }).click();
  await expect(page.getByRole("dialog", { name: "Garden centre" })).toBeVisible();
  await dialog.getByRole("button", { name: "Close" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("the image grows from its thumbnail, and not with reduced motion", async ({ page }) => {
  // Counts the animations started on an img, however fast they end on a slow machine.
  await page.addInitScript(() => {
    const animate = Element.prototype.animate;
    (window as unknown as { grows: number }).grows = 0;
    Element.prototype.animate = function (...args) {
      if (this.tagName === "IMG") (window as unknown as { grows: number }).grows++;
      return animate.apply(this, args);
    };
  });
  const opened = async () => {
    await page.getByRole("main").getByRole("button", { name: "Blue home page on a phone" }).first().click();
    await expect(page.getByRole("dialog").getByRole("img", { name: "Blue home page on a phone" })).toBeVisible();
    await page.waitForTimeout(500);
    return page.evaluate(() => (window as unknown as { grows: number }).grows);
  };
  await page.goto("/docs/lightbox");
  expect(await opened()).toBe(1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/docs/lightbox");
  expect(await opened()).toBe(0);
});

test("full screen at 390 px in dark: the image, the caption and the buttons all fit", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/lightbox");
  await page.getByRole("main").getByRole("button", { name: "Gold poster in a hotel lobby" }).first().click();
  const dialog = page.getByRole("dialog", { name: "Hotel campaign" });
  await expect(dialog).toBeVisible();
  const box = (await dialog.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(390);
  expect(box.y + box.height).toBeLessThanOrEqual(844);
  await expect(dialog.getByRole("button", { name: "Next" })).toBeInViewport();
});
