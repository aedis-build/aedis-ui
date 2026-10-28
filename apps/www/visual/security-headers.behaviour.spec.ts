import { expect, test } from "./fixtures";

// #201: the securityHeaders builder, used as a person checks the policy their server will send.

test("typed origins become media-src and font-src, and wildcards are dropped", async ({ page }) => {
  await page.goto("/docs/security-headers");
  const main = page.getByRole("main");
  const policy = main.getByRole("list", { name: "Content-Security-Policy" });
  await expect(policy).toContainText("media-src 'self' https://media.rlfn.studio;");
  await expect(main.getByText("Dropped, not an exact origin: https://*.cdn.example")).toBeVisible();

  const fonts = main.getByRole("textbox", { name: "fontSrc" });
  await fonts.click();
  await page.keyboard.type("https://fonts.rlfn.studio");
  await expect(policy).toContainText("font-src 'self' https://fonts.rlfn.studio;");

  const media = main.getByRole("textbox", { name: "mediaSrc" });
  await media.fill("https://media.rlfn.studio");
  await expect(main.getByText("Every origin is exact.")).toBeVisible();
});

test("the switch drops upgrade-insecure-requests, with the keyboard", async ({ page }) => {
  await page.goto("/docs/security-headers");
  const main = page.getByRole("main");
  const policy = main.getByRole("list", { name: "Content-Security-Policy" });
  await expect(policy).toContainText("upgrade-insecure-requests;");
  await main.getByRole("switch", { name: "upgradeInsecureRequests" }).focus();
  await page.keyboard.press("Space");
  await expect(policy).not.toContainText("upgrade-insecure-requests");
});

test("the site itself is served with the policy the builder describes", async ({ page }) => {
  const response = await page.goto("/docs/security-headers");
  const csp = response!.headers()["content-security-policy"];
  expect(csp).toContain("font-src 'self'");
  expect(csp).toContain("upgrade-insecure-requests");
  expect(csp).not.toContain("media-src");
});

test("the builder fits a 390 px screen in dark", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/security-headers");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
