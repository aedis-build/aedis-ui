import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";

// #241: the camera flies through the stem of the L of "RLFN" on /docs/text-mask.
const flying = (page: Page) => page.getByRole("main").locator("[data-slot=text-mask][data-flying]");
const settle = (page: Page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
/**
 * The colour of the pixel at the centre of the flying stage. Full bleed, that is the centre of the screen; in the docs
 * the sidebar moves the stage to the right of it.
 */
async function centre(page: Page) {
  const s = (await flying(page).locator("[aria-hidden=true]").first().boundingBox())!;
  const png = await page.screenshot({ clip: { x: Math.floor(s.x + s.width / 2), y: Math.floor(s.y + s.height / 2), width: 1, height: 1 } });
  // A 1 × 1 PNG: decode it in the page rather than ship a PNG decoder.
  return page.evaluate(async (b64) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const c = new OffscreenCanvas(1, 1).getContext("2d")!;
    c.drawImage(img, 0, 0);
    return [...c.getImageData(0, 0, 1, 1).data.slice(0, 3)];
  }, png.toString("base64"));
}

test.use({ bypassCSP: true });

for (const width of [390, 768, 1440]) {
  test(`at ${width} px the centre of the stage is the picture at 25%, 50% and 75% of the flight`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/docs/text-mask");
    const fly = flying(page);
    await expect(fly).toBeAttached();
    for (const share of [0.25, 0.5, 0.75]) {
      // The flight runs while the sticky stage holds: from the runway's top at the top, for its length less a screen.
      for (let i = 0; i < 2; i++) {
        await fly.evaluate((el, share) => {
          const r = el.getBoundingClientRect();
          window.scrollTo(0, window.scrollY + r.top + share * (r.height - window.innerHeight));
        }, share);
        await settle(page);
      }
      const [r, g, b] = await centre(page);
      // The mask is black; the picture is not.
      expect(r! + g! + b!, `pixel at ${share}: ${r},${g},${b}`).toBeGreaterThan(60);
    }
  });
}

test("before the flight the mask hides the picture around the letters, and the name is real text", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 800 });
  await page.goto("/docs/text-mask");
  await expect(page.getByRole("main").getByText("RLFN Studio", { exact: true })).toBeAttached();
  const layer = flying(page).locator("[data-slot=text-mask-layer]");
  expect(await layer.evaluate((el) => [getComputedStyle(el).mixBlendMode, getComputedStyle(el).backgroundColor])).toEqual(["multiply", "rgb(0, 0, 0)"]);
  await expect(page.getByRole("main").locator("[data-slot=text-mask] video")).toHaveJSProperty("muted", true);
});

test("with reduced motion it is a still mask with no runway, and the film stays on its poster", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/docs/text-mask");
  const main = page.getByRole("main");
  await expect(main.locator("[data-slot=text-mask]")).toHaveCount(3);
  await expect(main.locator("[data-slot=text-mask][data-flying]")).toHaveCount(0);
  await expect(main.locator("[data-slot=text-mask] video")).toHaveJSProperty("paused", true);
});

test("fits a 390 px screen in dark", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/text-mask");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
