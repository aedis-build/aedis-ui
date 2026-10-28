import { expect, test } from "./fixtures";

// #197: a contact form as a person fills it in, with the keyboard and the mouse.

test("a field shows its error when left, not only on submit, and the error is announced", async ({ page }) => {
  await page.goto("/docs/field");
  const main = page.getByRole("main");
  const email = main.getByRole("textbox", { name: "Email" }).first();
  await email.click();
  await email.pressSequentially("ana@");
  await page.keyboard.press("Tab");
  const error = main.getByText("Enter an email like name@studio.com.").first();
  await expect(error).toBeVisible();
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await expect(error.locator("xpath=ancestor::*[@aria-live='polite']")).toHaveCount(1);
  await expect(email).toHaveAccessibleDescription(/We answer within one working day\.\s*Enter an email like name@studio\.com\./);

  await email.fill("ana@studio.com");
  await page.keyboard.press("Tab");
  await expect(email).not.toHaveAttribute("aria-invalid");
});

test("Send checks every field and focuses the first invalid one; a valid form sends", async ({ page }) => {
  await page.goto("/docs/field");
  const main = page.getByRole("main");
  await main.getByRole("button", { name: "Send" }).first().click();
  await expect(main.getByRole("textbox", { name: "Name" }).first()).toBeFocused();
  await expect(main.getByText("Say a few words about the project.")).toBeVisible();

  await page.keyboard.type("Ana");
  await page.keyboard.press("Tab");
  await page.keyboard.type("ana@studio.com");
  await page.keyboard.press("Tab");
  await page.keyboard.type("A new identity for a ceramics studio.");
  // The honeypot is skipped: the next stop after Project is Send.
  await page.keyboard.press("Tab");
  await expect(main.getByRole("button", { name: "Send" }).first()).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(main.getByRole("status").filter({ hasText: "Thanks, Ana." })).toBeVisible();
});

test("the honeypot is out of reach: hidden from assistive tech, off screen, never focused", async ({ page }) => {
  await page.goto("/docs/field");
  const trap = page.getByRole("main").locator("input[name=website]").first();
  await expect(trap).toHaveAttribute("tabindex", "-1");
  await expect(trap.locator("xpath=ancestor::*[@aria-hidden='true']")).toHaveCount(1);
  const box = (await trap.boundingBox())!;
  expect(box.x + box.width).toBeLessThan(0);
  await expect(page.getByRole("main").getByRole("textbox", { name: "Leave this field empty" })).toHaveCount(0);
});

test("a field the server rejected shows its error at once", async ({ page }) => {
  await page.goto("/docs/field");
  const email = page.getByRole("main").getByRole("textbox", { name: "Email" }).nth(1);
  await email.scrollIntoViewIfNeeded();
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByText("This email is already on the list.")).toBeVisible();
});

test("the fieldset names its group, and a click or Space on a choice checks it", async ({ page }) => {
  await page.goto("/docs/fieldset");
  const group = page.getByRole("main").getByRole("group", { name: "What do you need?" }).first();
  const site = group.getByRole("checkbox", { name: "Website" });
  await group.getByText("Website").click();
  await expect(site).toBeChecked();
  await group.getByRole("checkbox", { name: "Photography" }).focus();
  await page.keyboard.press("Space");
  await expect(group.getByRole("checkbox", { name: "Photography" })).toBeChecked();
});

test("field and fieldset fit a 390 px screen without scrolling sideways", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/docs/field", "/docs/fieldset"]) {
    await page.goto(path);
    expect(await page.evaluate(() => document.documentElement.scrollWidth), path).toBeLessThanOrEqual(390);
  }
});
