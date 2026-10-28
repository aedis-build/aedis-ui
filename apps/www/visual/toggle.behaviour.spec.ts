import { expect, test } from "./fixtures";

// #190: pressed buttons, one at a time or many, with the mouse and the keyboard.

test("a toggle presses with a click and with Space, and says so with aria-pressed", async ({ page }) => {
  await page.goto("/docs/toggle");
  const main = page.getByRole("main");
  const pin = main.getByRole("button", { name: "Pin to profile" }).first();
  await expect(pin).toHaveAttribute("aria-pressed", "false");
  await pin.click();
  await expect(pin).toHaveAttribute("aria-pressed", "true");
  await expect(main.getByText("Pinned: it shows first on the profile.")).toBeVisible();
  await pin.focus();
  await page.keyboard.press("Space");
  await expect(pin).toHaveAttribute("aria-pressed", "false");
});

test("pressed is drawn by an outline, not color alone", async ({ page }) => {
  await page.goto("/docs/toggle");
  const pin = page.getByRole("main").getByRole("button", { name: "Pin to profile" }).first();
  const shadow = () => pin.evaluate((el) => getComputedStyle(el).boxShadow);
  expect(await shadow()).not.toContain("inset");
  await pin.click();
  expect(await shadow()).toContain("inset");
});

test("the group is one tab stop: arrows move, Space and Enter press several", async ({ page }) => {
  await page.goto("/docs/toggle-group");
  const main = page.getByRole("main");
  const group = main.getByRole("group", { name: "I need…" }).first();
  await group.getByRole("button", { name: "Brand identity" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(group.getByRole("button", { name: "Website" })).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await expect(main.getByText("3 chosen: site, photo, video")).toBeVisible();
  await page.keyboard.press("Tab");
  expect(await group.evaluate((el) => el.contains(document.activeElement))).toBe(false);
});

test("the segmented control keeps one option pressed and moves with the mouse", async ({ page }) => {
  await page.goto("/docs/toggle-group");
  const main = page.getByRole("main");
  const show = main.getByRole("group", { name: "Show" }).first();
  await show.scrollIntoViewIfNeeded();
  await show.getByRole("button", { name: "Photos" }).click();
  await expect(show.getByRole("button", { name: "Photos" })).toHaveAttribute("aria-pressed", "true");
  await show.getByRole("button", { name: "Videos" }).click();
  await expect(show.getByRole("button", { name: "Videos" })).toHaveAttribute("aria-pressed", "true");
  await expect(show.getByRole("button", { name: "Photos" })).toHaveAttribute("aria-pressed", "false");
  await expect(main.getByText("Showing videos.")).toBeVisible();
});

test("every item takes a press 44 px tall, and the groups fit 390 px in dark", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/toggle-group");
  const item = page.getByRole("main").getByRole("group", { name: "Show" }).first().getByRole("button", { name: "Videos" });
  await item.scrollIntoViewIfNeeded();
  const hit = await item.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const at = (y: number) => el.contains(document.elementFromPoint(r.left + r.width / 2, y));
    return { above: at(r.top + r.height / 2 - 21), below: at(r.top + r.height / 2 + 21) };
  });
  expect(hit).toEqual({ above: true, below: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
