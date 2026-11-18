import { expect, test } from "./fixtures";

// #276: the status badge on its docs page, read the way a person reads it: the words carry the state, the dot is decoration.
test("status badges say their state in words, hide the dot, and fit 390 px in dark", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/badge");
  const main = page.getByRole("main");
  for (const [label, tone] of [
    ["Compliant · 15/11/2026", "ok"],
    ["2 awaiting review", "attention"],
    ["Draft", "neutral"],
  ] as const) {
    const badge = main.locator("[data-slot=badge]").filter({ hasText: label }).first();
    await expect(badge).toBeVisible();
    const dot = badge.locator("[data-slot=badge-dot]");
    await expect(dot).toHaveAttribute("aria-hidden", "true");
    await expect(dot).toHaveAttribute("data-tone", tone);
    const box = await dot.boundingBox();
    expect(box?.width).toBeCloseTo(6, 0);
    // No filled backgrounds: colour lives only in the dot.
    expect(await badge.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe("rgba(0, 0, 0, 0)");
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
