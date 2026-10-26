import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";

// #157: getting around the site with the keyboard. Each check failed on main at 41d5382.

/** Contrast of a CSS color on another, both read from the page (WCAG relative luminance; alpha blended on `on`). */
const ringContrast = (page: Page, on: string) =>
  page.evaluate((on) => {
    const rgba = (value: string) => {
      const probe = document.createElement("i");
      probe.style.color = value;
      document.body.append(probe);
      const [r, g, b, a = 1] = getComputedStyle(probe).color.match(/[\d.]+/g)!.map(Number);
      probe.remove();
      return [r, g, b, a];
    };
    const root = getComputedStyle(document.documentElement);
    const [r, g, b, a] = rgba(root.getPropertyValue("--ring"));
    const [br, bg, bb] = rgba(root.getPropertyValue(on));
    const lum = (c: number[]) => c.map((v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
    const ring = lum([r * a + br * (1 - a), g * a + bg * (1 - a), b * a + bb * (1 - a)]);
    const back = lum([br, bg, bb]);
    return (Math.max(ring, back) + 0.05) / (Math.min(ring, back) + 0.05);
  }, on);

const ringSpread = (page: Page) => page.evaluate(() => Math.max(0, ...(getComputedStyle(document.activeElement!).boxShadow.match(/(\d+(?:\.\d+)?)px(?=\s*(?:,|$))/g) ?? []).map(parseFloat)));

for (const scheme of ["light", "dark"] as const) {
  test(`the focus ring has 3:1 contrast on surface and background in ${scheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/docs/button");
    expect(await ringContrast(page, "--surface")).toBeGreaterThanOrEqual(3);
    expect(await ringContrast(page, "--background")).toBeGreaterThanOrEqual(3);
  });
}

test("the first Tab offers a skip link, and it lands past the sidebar", async ({ page }) => {
  await page.goto("/docs/button");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.querySelector("main")!.contains(document.activeElement))).toBe(true);
});

test("a field reached with the keyboard is not hidden under the sticky header", async ({ page }) => {
  await page.goto("/docs/input");
  const field = page.locator("main input").first();
  // Park the field right under the header, as a reader scrolling down would, then Tab to it.
  await field.evaluate((el) => scrollBy(0, el.getBoundingClientRect().top - 10));
  await field.evaluate((el) => {
    const all = [...document.querySelectorAll<HTMLElement>("a[href], button, input, textarea, select, [tabindex]")].filter((e) => e.tabIndex >= 0);
    all[all.indexOf(el as HTMLElement) - 1]?.focus({ preventScroll: true });
  });
  await page.keyboard.press("Tab");
  await expect(field).toBeFocused();
  const header = await page.locator("body > header").boundingBox();
  expect((await field.boundingBox())!.y).toBeGreaterThanOrEqual(header!.y + header!.height);
});

test("On this page marks the section being read, the last one at the end, and the one clicked", async ({ page }) => {
  await page.goto("/docs/button");
  const toc = page.getByRole("navigation", { name: "On this page" });
  const entries = toc.getByRole("link");
  const last = entries.last();
  await last.click();
  await expect(last).toHaveAttribute("aria-current", "location");
  await page.evaluate(() => scrollTo(0, 0));
  await expect(entries.first()).toHaveAttribute("aria-current", "location");
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await expect(last).toHaveAttribute("aria-current", "location");
});

test("the docs sidebar shows the current page without scrolling the page", async ({ page }) => {
  await page.goto("/docs/tabs");
  const current = page.getByRole("navigation", { name: "Docs" }).locator("[aria-current=page]");
  await expect(current).toBeInViewport();
  expect(await page.evaluate(() => scrollY)).toBe(0);
});

test("the phone menu opens with the current page in view", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/tabs");
  await page.getByRole("button", { name: "Menu" }).click();
  const current = page.getByRole("dialog").getByRole("navigation", { name: "Docs" }).locator("[aria-current=page]");
  await expect(current).toBeInViewport();
});

test("a focused tab panel and a focused link show the ring", async ({ page }) => {
  await page.goto("/docs/tabs");
  const panel = page.locator("main [data-slot=tabs-content]:visible").nth(1);
  await panel.evaluate((el) => (el as HTMLElement).focus({ preventScroll: false }));
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(panel).toBeFocused();
  expect(await ringSpread(page)).toBeGreaterThan(0);

  await page.goto("/docs/link");
  const link = page.locator("main [data-slot=link]").first();
  await link.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(link).toBeFocused();
  expect(await ringSpread(page)).toBeGreaterThan(0);
});
