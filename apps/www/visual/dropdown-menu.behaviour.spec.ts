import { expect, test } from "./fixtures";

// #154: a label outside a group crashed every docs demo with Base UI error #31 as soon as the menu opened.
test("each dropdown demo opens, and its items work", async ({ page }) => {
  await page.goto("/docs/dropdown-menu");
  const main = page.getByRole("main");

  await main.getByRole("button", { name: "Session actions", exact: true }).first().click();
  const menu = page.getByRole("menu");
  await expect(menu).toContainText("Session");
  await menu.getByRole("menuitem", { name: "Revoke all sessions…" }).click();
  await expect(page.getByRole("alertdialog", { name: "Revoke every session?" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("alertdialog")).toHaveCount(0);

  await main.getByRole("button", { name: "View", exact: true }).first().click();
  await expect(page.getByRole("group", { name: "Sort by" })).toBeVisible();
  await page.getByRole("menuitemradio", { name: "Waiting longest" }).click();
  await expect(page.getByRole("menuitemradio", { name: "Waiting longest" })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByRole("menuitemcheckbox", { name: "Show autopilot runs" })).toHaveAttribute("aria-checked", "true");
});
