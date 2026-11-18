import { expect, test } from "./fixtures";

// #282: the console plans as a person on Plan and billing meets them. "/blocks/plans" is the block's page.

/** Every plan column's box and the box of its heading, in order. */
const boxes = (page: import("@playwright/test").Page) =>
  page.locator("[data-slot=plans] section").evaluateAll((sections) =>
    sections.map((s) => {
      const r = s.getBoundingClientRect();
      const h = s.querySelector("h2, h3")!.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height, titleY: h.y - r.y, titleH: h.height };
    }),
  );

for (const [width, columns] of [[1440, 5], [390, 1]] as const) {
  test(`at ${width} px the plans sit on ${columns} column(s), and switching plan moves no column by a pixel`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/blocks/view/plans");
    await expect(page.getByRole("region", { name: "Start" }).getByText("Current plan")).toBeVisible();
    const before = await boxes(page);
    expect(before).toHaveLength(5);
    expect(new Set(before.map((b) => Math.round(b.y))).size).toBe(width === 1440 ? 1 : 5);
    // The heading sits at the same place and height in every column, current or not.
    expect(new Set(before.map((b) => `${b.titleY}:${b.titleH}`)).size).toBe(1);

    await page.getByRole("button", { name: "Switch to Pro" }).click();
    await expect(page.getByRole("region", { name: "Pro" }).getByText("Current plan")).toBeVisible();
    await expect(page.getByRole("region", { name: "Start" }).getByText("Current plan")).toHaveCount(0);
    expect(await boxes(page)).toEqual(before);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  });
}

test("the actions are named in full and reachable by keyboard; the current plan has none", async ({ page }) => {
  await page.goto("/blocks/view/plans");
  await expect(page.getByRole("region", { name: "Start" }).getByRole("button")).toHaveCount(0);
  const pro = page.getByRole("button", { name: "Switch to Pro" });
  await page.getByRole("button", { name: "Switch to Free" }).focus();
  await page.keyboard.press("Tab");
  await expect(pro).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("region", { name: "Pro" }).getByText("Current plan")).toBeVisible();
  await expect(page.getByRole("link", { name: "Talk to us about Managed" })).toHaveAttribute("href", "#contact");
});

test("prices come in reais and in dollars, and the current rule is the accent", async ({ page }) => {
  await page.goto("/blocks/view/plans");
  const pro = page.getByRole("region", { name: "Pro" });
  await expect(pro).toContainText("R$");
  await page.getByRole("button", { name: "USD" }).click();
  await expect(pro).toContainText("$59");
  const [shadow, accent] = await page
    .getByRole("region", { name: "Start" })
    .evaluate((el) => [getComputedStyle(el).boxShadow, getComputedStyle(el).getPropertyValue("--accent").trim()]);
  expect(accent).not.toBe("");
  expect(shadow).toContain("inset");
});

test("the block page fits 390 px in light and dark", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const scheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/blocks/plans");
    expect(await page.evaluate(() => document.documentElement.scrollWidth), scheme).toBeLessThanOrEqual(390);
  }
});
