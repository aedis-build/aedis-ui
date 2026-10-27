import { expect, test } from "./fixtures";

// #160: navigation and layout, with a pointer, the keyboard and on a phone. Each check failed on main at 41d5382.

test("a navigation panel opened by hover stays open when its trigger is then clicked, and ↓ moves into it", async ({ page }) => {
  await page.goto("/docs/navigation-menu");
  const trigger = page.getByRole("main").locator("[data-slot=navigation-menu-trigger]").first();
  await trigger.hover();
  const popup = page.locator("[data-slot=navigation-menu-popup]");
  await expect(popup).toBeVisible();
  await page.waitForTimeout(600);
  await trigger.click();
  await page.waitForTimeout(400);
  await expect(popup).toBeVisible();
  await trigger.click();
  await expect(popup).toBeHidden();

  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(popup).toBeVisible();
  await page.keyboard.press("ArrowDown");
  expect(await page.evaluate(() => !!document.activeElement?.closest("[data-slot=navigation-menu-popup]"))).toBe(true);
});

test("the app shell on a phone opens its sidebar in a sheet that takes the focus and closes on Escape or a link", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/app-shell");
  // One landmark: the shell inside the docs page is not a second <main>.
  await expect(page.locator("main")).toHaveCount(1);
  const shell = page.locator("[data-slot=app-shell]").first();
  const menu = shell.getByRole("button", { name: "Menu" });
  const content = shell.locator("[data-slot=app-shell-main]");
  const before = (await content.boundingBox())!.y;
  await menu.click();
  const sheet = page.getByRole("dialog");
  await expect(sheet).toBeVisible();
  // Over the page, not pushing it down.
  expect((await content.boundingBox())!.y).toBe(before);
  expect(await page.evaluate(() => !!document.activeElement?.closest("[role=dialog]"))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
  await expect(menu).toBeFocused();

  await menu.click();
  await sheet.getByRole("link", { name: "Home" }).click();
  await expect(sheet).toBeHidden();
});

test("the sidebar's footer stays in view inside a short container", async ({ page }) => {
  await page.goto("/docs/app-shell");
  const shell = page.locator("[data-slot=app-shell]").first();
  const footer = shell.locator("[data-slot=sidebar-footer]").first();
  const box = (await shell.boundingBox())!;
  const foot = (await footer.boundingBox())!;
  expect(foot.y + foot.height).toBeLessThanOrEqual(box.y + box.height + 1);
});

test("pagination keeps Next on screen at 390 px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/pagination");
  await expect(page.getByRole("main").getByRole("link", { name: "Go to next page" }).first()).toBeInViewport({ ratio: 1 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("accordion headers take ↑ ↓ Home End, and stay put while they open", async ({ page }) => {
  await page.goto("/docs/accordion");
  const triggers = page.getByRole("main").locator("[data-slot=accordion-trigger]");
  const first = triggers.first();
  const y = (await first.boundingBox())!.y;
  await first.click();
  await page.waitForTimeout(700);
  expect((await first.boundingBox())!.y).toBe(y);
  await page.keyboard.press("ArrowDown");
  await expect(triggers.nth(1)).toBeFocused();
  await page.keyboard.press("End");
  await expect(triggers.last()).toBeFocused();
  await page.keyboard.press("Home");
  await expect(first).toBeFocused();
});

test("a disabled sidebar item shows why, and header and footer links are at least 24 px tall", async ({ page }) => {
  await page.goto("/docs/sidebar");
  await expect(page.getByRole("main").getByText("opens after hiring a social media agent")).toBeVisible();

  await page.goto("/docs/site-header");
  const header = page.getByRole("main").locator("header").first();
  const preview = page.getByRole("main").getByRole("tabpanel").first();
  expect((await header.boundingBox())!.width).toBeGreaterThan((await preview.boundingBox())!.width - 80);
  for (const link of await header.getByRole("link").all()) if (await link.isVisible()) expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(24);

  await page.goto("/docs/site-footer");
  for (const link of await page.getByRole("main").locator("footer").first().getByRole("link").all()) expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(24);
});
