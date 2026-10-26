import { expect, test } from "./fixtures";

// #162: the micro-frontends demo and the idle sign-out as a person meets them. Each check failed on main at 41d5382.

test("the frame shrinks with the remote, and mf-element is styled with no CSP violation", async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { violations: string[] }).violations = [];
    document.addEventListener("securitypolicyviolation", (e) => (window as unknown as { violations: string[] }).violations.push(e.violatedDirective));
  });
  await page.goto("/micro-frontends");
  const frame = page.locator("iframe[title='Billing remote']");
  const log = page.getByRole("list", { name: "Bridge events" });
  await expect(log).toContainText(/Height: the remote reports \d+ px/);
  const tall = (await frame.boundingBox())!.height;
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect.poll(async () => (await frame.boundingBox())!.height).toBeLessThan(tall - 10);

  // One log entry per new height, never the same height twice in a row.
  const heights = (await log.locator("li").allInnerTexts()).filter((t) => t.includes("Height:"));
  for (let i = 1; i < heights.length; i++) expect(heights[i]).not.toBe(heights[i - 1]);

  const track = page.locator("aedis-usage-meter").locator(".track");
  expect(await track.evaluate((el) => getComputedStyle(el).height)).toBe("6px");
  expect(await page.evaluate(() => (window as unknown as { violations: string[] }).violations)).toEqual([]);
});

test("the demo shell follows the site's theme, keeps the focus through sign-out, and can sign in and un-hang", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/micro-frontends");
  await expect(page.getByRole("tab", { name: "Dark" })).toHaveAttribute("aria-selected", "true");
  const log = page.getByRole("list", { name: "Bridge events" });
  await expect(log).toContainText("Handshake: the remote is ready");

  const session = page.getByRole("button", { name: "Sign out" });
  await session.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Sign in" })).toBeFocused();
  // Signed out, billing answers no one.
  await page.getByRole("button", { name: "Ask the remote for its status" }).click();
  await expect(log).toContainText("Request failed");
  await expect(log).not.toContainText("Response: 3 open invoices");

  await page.getByRole("button", { name: "Sign in" }).click();
  const remote = page.frameLocator("iframe[title='Billing remote']");
  await expect(remote.getByRole("button", { name: /INV-4822/ })).toBeVisible();
  await page.getByRole("button", { name: "Make the remote hang" }).click();
  await expect(page.getByRole("button", { name: "Reload the remote" })).toBeFocused();
  await page.getByRole("button", { name: "Reload the remote" }).click();
  await page.getByRole("button", { name: "Ask the remote for its status" }).click();
  await expect(log).toContainText("Response: 3 open invoices");
});

test("the secure shell warns before signing out, Escape stays, and the sign-out is announced with the focus on Sign in", async ({ page }) => {
  await page.clock.install();
  await page.goto("/blocks/view/secure-shell");
  await page.getByRole("button", { name: "Simulate a revoked session" }).waitFor();
  await page.clock.fastForward("14:01");
  const warning = page.getByRole("alertdialog", { name: "Still there?" });
  await expect(warning).toBeVisible();
  await expect(warning.getByRole("button", { name: "Stay signed in" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(warning).toBeHidden();
  await expect(page.getByRole("button", { name: "Simulate a revoked session" })).toBeVisible();

  await page.clock.fastForward("15:01");
  await expect(page.getByRole("alert").filter({ hasText: "Signed out for inactivity" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeFocused();
  // The way back is in view, not clipped under the frame.
  await expect(page.getByRole("button", { name: "Reset the demo" })).toBeInViewport({ ratio: 1 });
});
