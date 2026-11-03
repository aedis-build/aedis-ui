import { expect, test } from "./fixtures";

// #257: line numbers and window chrome on /docs/code-block.
test.use({ permissions: ["clipboard-read", "clipboard-write"] });

test("the gutter counts the lines, and neither the copy button nor a selection copies the numbers", async ({ page }) => {
  await page.goto("/docs/code-block");
  const block = page.getByRole("main").locator("[data-slot=code-block]").filter({ hasText: "middleware.ts" });
  const lines = block.locator("[data-slot=code-block-line]");
  const numbers = block.locator("[data-slot=code-block-line-number]");
  await expect(numbers).toHaveCount(await lines.count());
  expect(await numbers.allTextContents()).toEqual(Array.from({ length: await lines.count() }, (_, i) => String(i + 1)));

  await block.getByRole("button", { name: "Copy code" }).click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied.startsWith('import { securityHeaders } from "@/lib/security-headers";')).toBe(true);
  expect(copied).not.toMatch(/^\d/m);

  const selected = await block.locator("code").evaluate((code) => {
    getSelection()!.selectAllChildren(code);
    return getSelection()!.toString();
  });
  expect(selected).not.toMatch(/^\s*\d+\s*(import|export|const|\}|$)/m);
  expect(selected).toContain("securityHeaders({ nonce: crypto.randomUUID() })");
});

test("the window's dots are hidden from the accessibility tree, and the file name is read", async ({ page }) => {
  await page.goto("/docs/code-block");
  const block = page.getByRole("main").locator("[data-slot=code-block]").filter({ hasText: "middleware.ts" });
  await expect(block.locator("[data-slot=code-block-dots]")).toHaveAttribute("aria-hidden", "true");
  const tree = await block.ariaSnapshot();
  expect(tree).toContain("middleware.ts");
  expect(tree).not.toMatch(/dots/);
  await expect(block.getByRole("button", { name: "Copy code" })).toBeVisible();
});

test("the gutter stays put while a long line scrolls, and the page fits 390 px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/code-block");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  const block = page.getByRole("main").locator("[data-slot=code-block]").filter({ hasText: "middleware.ts" });
  const pre = block.locator("pre");
  const first = block.locator("[data-slot=code-block-line-number]").first();
  const before = (await first.boundingBox())!.x;
  await pre.evaluate((el) => (el.scrollLeft = 120));
  expect(await pre.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
  expect(Math.abs((await first.boundingBox())!.x - before)).toBeLessThan(1);
});
