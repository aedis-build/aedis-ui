import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";

// #281: the Identity wizard as a person walks it, by keyboard and by mouse, on a wide screen and on a phone.
const wizard = (page: Page) => page.getByRole("main").locator("[data-slot=steps]").first();
const statuses = (page: Page) => wizard(page).locator(":scope > li").evaluateAll((lis) => lis.map((li) => li.getAttribute("data-status")));

test("by keyboard: Enter submits a step and the focus lands on the next step's heading", async ({ page }) => {
  await page.goto("/docs/steps");
  await expect(wizard(page).locator("li[aria-current=step]")).toHaveCount(1);
  expect(await statuses(page)).toEqual(["done", "current", "upcoming", "upcoming"]);

  await wizard(page).getByRole("textbox", { name: "Redirect URI" }).focus();
  await page.keyboard.type("https://app.example.com/callback");
  await page.keyboard.press("Enter");
  await expect(wizard(page).getByRole("heading", { name: "Add the JWKS credential" })).toBeFocused();
  await expect(wizard(page).getByText("https://app.example.com/callback")).toBeVisible();

  // Tab from the heading reaches the new step's field.
  await page.keyboard.press("Tab");
  await expect(wizard(page).getByRole("textbox", { name: "JWKS URL" })).toBeFocused();
  await page.keyboard.type("https://app.example.com/.well-known/jwks.json");
  await page.keyboard.press("Enter");
  await expect(wizard(page).getByRole("heading", { name: "Test the sign-in" })).toBeFocused();
  expect(await statuses(page)).toEqual(["done", "done", "done", "current"]);
});

test("by mouse: Change reopens a done step with its value and focuses it", async ({ page }) => {
  await page.goto("/docs/steps");
  await wizard(page).getByRole("button", { name: "Change Create the application" }).click();
  await expect(wizard(page).getByRole("heading", { name: "Create the application" })).toBeFocused();
  await expect(wizard(page).getByRole("textbox", { name: "Application name" })).toHaveValue("Aedis Console");
  expect(await statuses(page)).toEqual(["current", "upcoming", "upcoming", "upcoming"]);
  await expect(wizard(page).getByRole("heading", { name: "Add a redirect URI (not started)" })).toBeAttached();

  // An empty required field does not move on.
  await wizard(page).getByRole("textbox", { name: "Application name" }).fill("");
  await wizard(page).getByRole("button", { name: "Continue" }).click();
  expect(await statuses(page)).toEqual(["current", "upcoming", "upcoming", "upcoming"]);
});

test("finishing marks every step done and moves the focus to the closing message", async ({ page }) => {
  await page.goto("/docs/steps");
  for (const [field, value] of [
    ["Redirect URI", "https://app.example.com/callback"],
    ["JWKS URL", "https://app.example.com/.well-known/jwks.json"],
    ["Test user email", "ana@example.com"],
  ] as const) {
    await wizard(page).getByRole("textbox", { name: field }).fill(value);
    await wizard(page).getByRole("button", { name: /^(Continue|Finish)$/ }).click();
  }
  expect(await statuses(page)).toEqual(["done", "done", "done", "done"]);
  await expect(page.getByRole("main").getByRole("status").filter({ hasText: "All four steps are done." })).toBeFocused();
});

for (const width of [390, 1440]) {
  test(`at ${width} px the number is ${width < 640 ? "above" : "beside"} the title, and nothing scrolls sideways`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/docs/steps");
    const current = wizard(page).locator("li[aria-current=step]");
    const number = (await current.locator("[data-slot=step-number]").boundingBox())!;
    const title = (await current.getByRole("heading").boundingBox())!;
    if (width < 640) {
      expect(number.y + number.height).toBeLessThanOrEqual(title.y + 1);
      // The form keeps the full width of the step.
      expect(Math.abs(title.x - number.x)).toBeLessThanOrEqual(1);
    } else {
      expect(number.x + number.width).toBeLessThan(title.x);
      expect(Math.abs(number.y - title.y)).toBeLessThan(title.height);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  });
}

test("fits a 390 px screen in dark", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/steps");
  await expect(wizard(page)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
