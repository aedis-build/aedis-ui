import type { Locator } from "@playwright/test";

import { expect, test } from "./fixtures";

// #249: the pill shape and the trailing icon that moves on hover, on the built docs page.
const radius = (el: Locator) => el.evaluate((e) => parseFloat(getComputedStyle(e).borderTopLeftRadius));
// Tailwind moves with the translate property ("2px 0px", or "none"), not transform.
const shift = (el: Locator) => el.evaluate((e) => parseFloat(getComputedStyle(e).translate) || 0);

test("a pill is fully round in every variant, and the default keeps the theme radius", async ({ page }) => {
  await page.goto("/docs/button");
  const main = page.getByRole("main");
  for (const variant of ["default", "secondary", "outline", "ghost", "destructive", "link"]) {
    const pill = main.getByRole("group", { name: "pill shape" }).getByRole("button", { name: variant });
    const box = (await pill.boundingBox())!;
    expect(await radius(pill)).toBeGreaterThanOrEqual(box.height / 2);
    const plain = main.getByRole("group", { name: "default shape" }).getByRole("button", { name: variant });
    expect(await radius(plain)).toBeLessThan(box.height / 2);
  }
});

test("the focus ring follows the pill, and the icon slides forward on hover and focus", async ({ page }) => {
  await page.goto("/docs/button");
  const talk = page.getByRole("main").getByRole("button", { name: "Talk to us" });
  const icon = talk.locator("[data-slot=icon]");
  expect(await shift(icon)).toBe(0);
  await talk.hover();
  await expect.poll(() => shift(icon)).toBe(2);
  await page.mouse.move(0, 0);
  await expect.poll(() => shift(icon)).toBe(0);

  await talk.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(talk).toBeFocused();
  // The ring is a box-shadow, so it takes the element's own radius.
  expect(await talk.evaluate((e) => getComputedStyle(e).boxShadow)).not.toBe("none");
  expect(await radius(talk)).toBeGreaterThanOrEqual((await talk.boundingBox())!.height / 2);
  await expect.poll(() => shift(icon)).toBe(2);
  expect((await talk.boundingBox())!.height).toBeGreaterThanOrEqual(44);
});

test("with reduced motion the icon stays put", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/docs/button");
  const talk = page.getByRole("main").getByRole("button", { name: "Talk to us" });
  await talk.hover();
  await page.waitForTimeout(400);
  expect(await shift(talk.locator("[data-slot=icon]"))).toBe(0);
});
