import { expect, test } from "./fixtures";

// #156: approving, answering and rating, as a person does it on the built site. Each check failed on main at 41d5382.

const focusedText = (page: import("@playwright/test").Page) => page.evaluate(() => (document.activeElement === document.body ? "<body>" : document.activeElement!.textContent!.trim()));

test("a double-click on the confirm approves once, then the card shows the outcome and holds the focus", async ({ page }) => {
  await page.goto("/docs/approval-card");
  const card = page.locator("[data-slot=approval-card]").first();
  await card.getByRole("button", { name: "Approve" }).click();
  await page.getByRole("alertdialog").locator("[data-slot=alert-dialog-action]").dblclick();
  await expect(card.getByRole("status")).toHaveText("Approved by you");
  await expect(card.getByRole("button", { name: "Approve" })).toHaveCount(0);
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  await expect(card.getByRole("status")).toBeFocused();
});

test("request changes takes the focus to the reason, Back returns it, and sending shows the outcome", async ({ page }) => {
  await page.goto("/docs/approval-card");
  const card = page.locator("[data-slot=approval-card]").first();
  await card.getByRole("button", { name: "Request changes" }).click();
  await expect(card.getByRole("textbox", { name: "What should change" })).toBeFocused();
  await card.getByRole("button", { name: "Back" }).click();
  await expect(card.getByRole("button", { name: "Request changes" })).toBeFocused();
  await page.keyboard.press("Enter");
  await page.keyboard.type("Add the annual option");
  await card.getByRole("button", { name: "Request changes" }).click();
  await expect(card.getByRole("status")).toContainText("Add the annual option");
  expect(await focusedText(page)).not.toBe("<body>");
});

test("the inbox follows the tab, answers a raised hand once, and remembers what was decided", async ({ page }) => {
  await page.goto("/blocks/view/approval-inbox");
  await page.getByRole("tab", { name: /Raised hands/ }).click();
  // The detail shows this tab's item, not the approval left open on the other tab.
  await expect(page.locator("[data-slot=hand-raise]")).toBeVisible();
  await expect(page.locator("[data-slot=approval-card]")).toHaveCount(0);

  await page.getByRole("textbox", { name: "Your answer" }).fill("Not for 12 months.");
  await page.getByRole("button", { name: "Answer" }).dblclick();
  await expect(page.getByRole("status").filter({ hasText: "Answered by you" })).toBeFocused();
  await expect(page.getByRole("button", { name: "Answer" })).toHaveCount(0);
  await expect(page.getByRole("tab", { name: /Raised hands/ })).toContainText("0");

  await page.getByRole("tab", { name: /Approvals/ }).click();
  await page.getByRole("tab", { name: /Raised hands/ }).click();
  await expect(page.getByText("Answered by you.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Answer" })).toHaveCount(0);
});

test("a thumb keeps the focus while it sends and after", async ({ page }) => {
  await page.goto("/docs/feedback");
  const up = page.getByRole("button", { name: "Good answer" }).first();
  await up.click();
  await expect(page.getByRole("status").filter({ hasText: "Thanks" }).first()).toBeVisible();
  await expect(up).toBeFocused();
});

test("the home showcase approval shows its outcome", async ({ page }) => {
  await page.goto("/");
  const card = page.locator("[data-slot=approval-card]").first();
  await card.getByRole("button", { name: "Approve" }).click();
  await page.getByRole("alertdialog").locator("[data-slot=alert-dialog-action]").click();
  await expect(card.getByRole("status")).toHaveText("Approved by you");
});
