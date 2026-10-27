import { expect, test } from "./fixtures";

// #158: overlays on a short screen, with assistive tech, by touch and from the keyboard. Each check failed on main at 41d5382.

for (const [path, trigger, slot] of [
  ["/docs/dialog", "Invite a person", "dialog-content"],
  ["/docs/alert-dialog", "Approve and send", "alert-dialog-content"],
] as const) {
  test(`${slot} taller than the screen stays on it and scrolls inside itself`, async ({ page }) => {
    // Shorter than the dialog: the same as long content on a phone held sideways.
    const height = 140;
    await page.setViewportSize({ width: 390, height });
    await page.goto(path);
    await page.getByRole("main").getByRole("button", { name: trigger, exact: true }).first().click();
    const popup = page.locator(`[data-slot=${slot}]`);
    await expect(popup).toBeVisible();
    await page.waitForTimeout(400);
    const box = (await popup.boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(height);
    // Its end can be reached and seen.
    const last = popup.locator(":scope > *").last();
    await last.scrollIntoViewIfNeeded();
    await expect(last).toBeInViewport();
  });
}

test("a press on the alert dialog's backdrop keeps the focus inside, on Cancel", async ({ page }) => {
  await page.goto("/docs/alert-dialog");
  await page.getByRole("main").getByRole("button", { name: "Approve and send" }).first().click();
  const cancel = page.getByRole("alertdialog").getByRole("button", { name: "Cancel" });
  await expect(cancel).toBeFocused();
  await page.mouse.click(5, 5);
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await expect(cancel).toBeFocused();
});

test("the tooltip describes its trigger for assistive tech, and a tap shows it on touch", async ({ browser }) => {
  const context = await browser.newContext({ baseURL: test.info().project.use.baseURL, viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await page.goto("/docs/tooltip");
  const trigger = page.getByRole("main").getByRole("button", { name: "Ceiling" }).first();
  await expect(trigger).toHaveAccessibleDescription("The most this agent can cost per day.");
  await trigger.tap();
  await expect(page.getByRole("tooltip")).toBeVisible();
  await context.close();
});

test("wrapping in the site search shows the first group's heading, and No results is already a live region", async ({ page }) => {
  await page.goto("/docs/command");
  await page.keyboard.press("Control+k");
  const listbox = page.getByRole("dialog").getByRole("listbox");
  await expect(listbox).toBeVisible();
  await expect(page.getByRole("dialog").getByRole("status")).toHaveCount(1);
  await page.keyboard.press("End");
  await page.keyboard.press("ArrowDown");
  const heading = listbox.getByRole("group").first().locator("> div").first();
  const [list, head] = [(await listbox.boundingBox())!, (await heading.boundingBox())!];
  expect(head.y).toBeGreaterThanOrEqual(list.y - 1);
  // The page itself did not scroll.
  expect(await page.evaluate(() => scrollY)).toBe(0);
});

test("the Command demo promises no shortcut it does not have", async ({ page }) => {
  await page.goto("/docs/command");
  await expect(page.getByRole("main").getByRole("button", { name: /^Go to/ }).first()).toHaveText("Go to…");
});

test("an error toast interrupts: it is in an alert", async ({ page }) => {
  await page.goto("/docs/toast");
  await page.getByRole("main").getByRole("button", { name: "Failure", exact: true }).first().click();
  await expect(page.getByRole("alert").filter({ hasText: "Something went wrong" })).toHaveCount(1);
});
