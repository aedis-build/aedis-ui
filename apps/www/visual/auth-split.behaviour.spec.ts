import { expect, test } from "./fixtures";

// #283: sign in and sign up on one split screen, as a person meets them.

test("the keyboard goes Google, email, submit, passkey; Enter in the email field submits", async ({ page }) => {
  await page.goto("/blocks/view/auth-split");
  await expect(page.getByRole("heading", { level: 1, name: "Sign in to Aedis" })).toBeVisible();
  const google = page.getByRole("button", { name: "Continue with Google" });
  await google.focus();
  await page.keyboard.press("Tab");
  const email = page.getByRole("textbox", { name: "Work email" });
  await expect(email).toBeFocused();
  await expect(email).toHaveAttribute("autocomplete", "username webauthn");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Continue with email" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Sign in with a passkey" })).toBeFocused();
  await email.fill("ana@company.com");
  await email.press("Enter");
  await expect(page.getByRole("status")).toHaveText("Simulated: a sign-in link would go to that address. Nothing was sent.");
});

test("sign in and sign up keep the divider and the form column in the same place", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/blocks/view/auth-split");
  const main = page.locator("[data-slot=auth-split-main]");
  const before = (await main.boundingBox())!;
  expect(Math.round(before.width)).toBe(480);
  await page.getByRole("button", { name: "Create an account" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Create your Aedis account" })).toBeVisible();
  const after = (await main.boundingBox())!;
  expect(after.x).toBe(before.x);
  expect(after.height).toBe(before.height);
  await expect(page.locator("[data-slot=auth-split-facts] li")).toHaveCount(3);
  for (const target of [page.getByRole("button", { name: "Sign in" }), page.getByRole("link", { name: "How accounts are kept safe" })]) {
    expect((await target.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
});

test("on a short, narrower screen the divider and the form column still stay put between the two pages", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 640 });
  await page.goto("/blocks/view/auth-split");
  const aside = page.locator("[data-slot=auth-split-aside]");
  const main = page.locator("[data-slot=auth-split-main]");
  const before = [(await aside.boundingBox())!, (await main.boundingBox())!];
  await page.getByRole("button", { name: "Create an account" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Create your Aedis account" })).toBeVisible();
  const after = [(await aside.boundingBox())!, (await main.boundingBox())!];
  expect(after[0]!.x + after[0]!.width).toBe(before[0]!.x + before[0]!.width);
  expect(after[1]).toEqual(before[1]);
});

for (const scheme of ["light", "dark"] as const) {
  test(`at 390 px in ${scheme} it is one column: mark, short statement, then the form with no gap`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/blocks/auth-split");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await page.goto("/blocks/view/auth-split");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await expect(page.getByText("Every change, signed and on record.")).toBeVisible();
    await expect(page.getByText("Every change to your systems, signed, reviewed and on record.")).toBeHidden();
    await expect(page.locator("[data-slot=auth-split-facts]")).toBeHidden();
    const aside = (await page.locator("[data-slot=auth-split-aside]").boundingBox())!;
    const h1 = (await page.getByRole("heading", { level: 1 }).boundingBox())!;
    expect(h1.y - (aside.y + aside.height)).toBeLessThan(48);
    await expect(page.getByRole("button", { name: "Continue with Google" })).toBeInViewport();
  });
}
