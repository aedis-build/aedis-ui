import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";

// #200: the abuse libraries, driven in their simulators the way an attacker and a person would meet them.

const log = (page: Page, name: string) => page.getByRole("main").getByRole("log", { name }).first().locator("li").first();

test("the gate takes 3 submits per contact, refuses the 4th, and lets it through once the window slides", async ({ page }) => {
  await page.goto("/docs/abuse-gate");
  const main = page.getByRole("main");
  const submit = main.getByRole("button", { name: "Submit" }).first();
  for (let i = 0; i < 3; i++) {
    await submit.click();
    await expect(log(page, "Gate results")).toHaveText("Accepted.");
  }
  await submit.click();
  await expect(log(page, "Gate results")).toHaveText("Refused: too many for this contact. Retry in 10 min.");
  await expect(main.getByText(/^Stored key: target:[\w-]{43}$/)).toBeVisible();
  await expect(main.getByText(/Stored key:.*ana@studio/)).toHaveCount(0);

  // The same person typing their email differently is still the same contact.
  await main.getByRole("textbox", { name: "Email" }).fill("  ANA@studio.com ");
  await submit.click();
  await expect(log(page, "Gate results")).toHaveText(/^Refused: too many for this contact/);

  await main.getByRole("button", { name: "Wait 5 minutes" }).click();
  await main.getByRole("button", { name: "Wait 5 minutes" }).click();
  await submit.press("Enter");
  await expect(log(page, "Gate results")).toHaveText("Accepted.");
});

test("one IP cannot spray many contacts", async ({ page }) => {
  await page.goto("/docs/abuse-gate");
  const main = page.getByRole("main");
  const email = main.getByRole("textbox", { name: "Email" });
  for (let i = 0; i < 5; i++) {
    await email.fill(`person${i}@example.com`);
    await main.getByRole("button", { name: "Submit" }).click();
    await expect(log(page, "Gate results")).toHaveText("Accepted.");
  }
  await email.fill("person9@example.com");
  await main.getByRole("button", { name: "Submit" }).click();
  await expect(log(page, "Gate results")).toHaveText(/^Refused: too many for this IP/);
});

test("wrong passwords lock for 1 minute, then 15, and the right one clears it", async ({ page }) => {
  await page.goto("/docs/brute-force-guard");
  const main = page.getByRole("main");
  const password = main.getByLabel("Password for ana@studio.com");
  const signIn = main.getByRole("button", { name: "Sign in" });
  const fail3 = async () => {
    for (let i = 0; i < 3; i++) {
      await password.fill("guess");
      await signIn.click();
    }
  };
  await password.fill("guess");
  await signIn.click();
  await signIn.click();
  await signIn.click();
  await expect(log(page, "Sign-in results")).toHaveText("Wrong password. Locked for 1 min.");
  await signIn.click();
  await expect(log(page, "Sign-in results")).toHaveText("Locked. Try again in 1 min.");
  await main.getByRole("button", { name: "Wait 1 minute" }).click();
  await fail3();
  await expect(log(page, "Sign-in results")).toHaveText("Wrong password. Locked for 15 min.");
  await main.getByRole("button", { name: "Wait 15 minutes" }).click();
  await password.fill("open sesame");
  await signIn.click();
  await expect(log(page, "Sign-in results")).toHaveText("Signed in. Failures cleared.");
});

test("the form token refuses an instant submit, a forged time and an old form", async ({ page }) => {
  await page.goto("/docs/form-token");
  const main = page.getByRole("main");
  await main.getByRole("button", { name: "Render form" }).click();
  await expect(main.getByText(/^Hidden field: v1\.\d{13}\.[\w-]{43}$/)).toBeVisible();
  await main.getByRole("button", { name: "Send", exact: true }).click();
  await expect(log(page, "Submit results")).toHaveText("Refused: sent faster than a person can fill a form.");
  await main.getByRole("button", { name: "Wait 5 seconds" }).click();
  await main.getByRole("button", { name: "Send with a forged time" }).click();
  await expect(log(page, "Submit results")).toHaveText("Refused: the signature does not match.");
  await main.getByRole("button", { name: "Send", exact: true }).click();
  await expect(log(page, "Submit results")).toHaveText("Accepted, 5 s after rendering.");
  await main.getByRole("button", { name: "Wait 1 hour" }).click();
  await main.getByRole("button", { name: "Send", exact: true }).click();
  await expect(log(page, "Submit results")).toHaveText("Refused: the form is over an hour old.");
});

test("the simulators fit 390 px in dark", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.setViewportSize({ width: 390, height: 844 });
  for (const name of ["abuse-gate", "brute-force-guard", "form-token"]) {
    await page.goto(`/docs/${name}`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth), name).toBeLessThanOrEqual(390);
  }
});
