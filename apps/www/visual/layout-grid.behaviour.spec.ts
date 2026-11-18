import { expect, test } from "./fixtures";

// #273: a chapter of hotels in blocks of their own shape that grow into a centered card.

const grid = (page: import("@playwright/test").Page) => page.getByRole("main").locator("[data-slot=layout-grid]").first();

test("pairs alternate 2+1 and 1+2, and three vertical pieces make a group without holes", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/docs/layout-grid");
  const boxes = await grid(page).locator("li").evaluateAll((lis) => lis.map((li) => li.getBoundingClientRect().toJSON() as DOMRect));
  const [lobby, arrival, stair, morning, courtyard, pool, terrace] = boxes;
  // 2+1: the lobby is wide on the left, the arrival film narrow on the right, the same height.
  expect(lobby!.width).toBeGreaterThan(arrival!.width * 1.8);
  expect(arrival!.x).toBeGreaterThan(lobby!.x);
  expect(Math.abs(lobby!.height - arrival!.height)).toBeLessThan(2);
  // The group: a feature two columns wide and two rows tall, two stacked blocks beside it.
  expect(stair!.width).toBeGreaterThan(morning!.width * 1.8);
  expect(Math.abs(morning!.x - courtyard!.x)).toBeLessThan(1);
  expect(Math.abs(stair!.y + stair!.height - (courtyard!.y + courtyard!.height))).toBeLessThan(2);
  // 1+2: the narrow block is on the left, the wide terrace on the right.
  expect(pool!.x).toBeLessThan(terrace!.x);
  expect(terrace!.width).toBeGreaterThan(pool!.width * 1.8);
});

test("a click grows a block into a card named by its title; Esc closes and returns the focus", async ({ page }) => {
  await page.goto("/docs/layout-grid");
  const block = grid(page).getByRole("link", { name: "Photo: Casa do Largo" });
  await block.click();
  const dialog = page.getByRole("dialog", { name: "Casa do Largo" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("A lobby that opens onto the square");
  await expect(dialog.getByRole("button", { name: "Close" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(block).toBeFocused();
});

test("the keyboard opens a film; Close and a click outside close the card", async ({ page }) => {
  await page.goto("/docs/layout-grid");
  const block = grid(page).getByRole("link", { name: "Film: Arrival" });
  await block.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Arrival" });
  await expect(dialog.locator("video[controls]")).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(block).toBeFocused();
  await block.click();
  await expect(dialog).toBeVisible();
  await page.mouse.click(5, 5);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("without a View Transition under reduced motion, the card opens at once", async ({ page }) => {
  await page.addInitScript(() => {
    const start = document.startViewTransition?.bind(document);
    (window as unknown as { transitions: number }).transitions = 0;
    if (start)
      document.startViewTransition = ((update: () => void) => {
        (window as unknown as { transitions: number }).transitions++;
        return start(update);
      }) as typeof document.startViewTransition;
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/docs/layout-grid");
  await grid(page).getByRole("link", { name: "Photo: Casa do Largo" }).click();
  await expect(page.getByRole("dialog", { name: "Casa do Largo" })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { transitions: number }).transitions)).toBe(0);
});

test("at 390 px in dark: one column, blocks in their own shape, and the card never wider than the screen", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/layout-grid");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  const arrival = (await grid(page).locator("li").nth(1).boundingBox())!;
  expect(arrival.height).toBeGreaterThan(arrival.width * 1.7);
  await grid(page).getByRole("link", { name: "Film: Terrace" }).click();
  const dialog = page.getByRole("dialog", { name: "Terrace" });
  await expect(dialog).toBeVisible();
  const box = (await dialog.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(390);
  await expect(dialog.getByRole("button", { name: "Close" })).toBeInViewport();
});
