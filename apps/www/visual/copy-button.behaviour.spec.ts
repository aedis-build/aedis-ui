import { expect, test } from "./fixtures";

// #198: copying a share link, and what happens where the browser will not copy.

test("a click copies the link, says Copied for about 2 s, then goes back", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/docs/copy-button");
  const main = page.getByRole("main");
  await main.getByRole("button", { name: "Copy link" }).first().click();
  await expect(main.getByRole("button", { name: "Copied" }).first()).toBeVisible();
  await expect(main.getByRole("status").filter({ hasText: "Copied" })).toHaveCount(1);
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("https://rlfn.studio/p/ana-ceramics");
  await expect(main.getByRole("button", { name: "Copy link" }).first()).toBeVisible({ timeout: 3000 });
});

test("the keyboard copies too", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/docs/copy-button");
  await page.getByRole("main").getByRole("button", { name: "Copy link" }).first().focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main").getByRole("button", { name: "Copied" }).first()).toBeFocused();
});

test("where the browser refuses, the link shows selected and focused for Ctrl+C", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: () => Promise.reject(new DOMException("denied", "NotAllowedError")) } });
  });
  await page.goto("/docs/copy-button");
  const main = page.getByRole("main");
  await main.getByRole("button", { name: "Copy link" }).first().click();
  const field = main.getByRole("textbox", { name: /press Ctrl\+C/ }).first();
  await expect(field).toBeFocused();
  await expect(field).toHaveValue("https://rlfn.studio/p/ana-ceramics");
  expect(await field.evaluate((el: HTMLInputElement) => [el.selectionStart, el.selectionEnd])).toEqual([0, 34]);
  await expect(main.getByRole("status").filter({ hasText: "selected" })).toHaveCount(1);
});

test("the copy row fits a 390 px screen in dark", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/copy-button");
  const button = page.getByRole("main").getByRole("button", { name: "Copy link" }).first();
  const box = (await button.boundingBox())!;
  expect(box.x + box.width).toBeLessThanOrEqual(390);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
