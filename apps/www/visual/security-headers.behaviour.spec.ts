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
  // The preview clips, so the page never scrolls: check the cache demo's own edges stay on screen.
  const main = page.getByRole("main");
  for (const el of [main.getByRole("button", { name: "immutable" }), main.getByRole("status", { name: "Cache headers" })]) {
    const box = (await el.boundingBox())!;
    expect(box.x + box.width).toBeLessThanOrEqual(390 - 16);
  }
});

// #231: the cache policy per response, chosen from the path or by hand.
test("a public path is cached without scripts, a page is not, and a nonce refuses a cacheable policy", async ({ page }) => {
  await page.goto("/docs/security-headers");
  const main = page.getByRole("main");
  const out = main.getByRole("status", { name: "Cache headers" });
  await expect(main.getByText("Policy: public")).toBeVisible();
  await expect(out).toContainText("Cache-Control: public, max-age=3600, stale-while-revalidate=86400, no-transform");
  await expect(out).toContainText("script-src 'none';");

  const path = main.getByRole("textbox", { name: "Path" });
  await path.fill("/_next/static/chunks/app.js");
  await expect(out).toContainText("Cache-Control: public, max-age=31536000, immutable, no-transform");
  await path.fill("/account");
  await expect(main.getByText("Policy: private")).toBeVisible();
  // A private page runs scripts, so it needs its nonce.
  await expect(out).toContainText("Refused: securityHeaders: give either nonce or hashes");

  await main.getByRole("switch", { name: "Has a nonce" }).press("Space");
  await expect(out).toContainText("Cache-Control: no-store, no-transform");
  await expect(out).toContainText("script-src 'self' 'nonce-r4nd0m' 'strict-dynamic';");
  await main.getByRole("group", { name: "Cache policy" }).getByRole("button", { name: "public" }).click();
  await expect(out).toContainText("Refused: securityHeaders: a response with a nonce is never cached");
});
