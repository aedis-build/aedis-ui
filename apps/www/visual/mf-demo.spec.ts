import { expect, test } from "@playwright/test";

/**
 * The live micro-frontends demo on the built site (#135): a shell and a same-origin, sandboxed remote talking over
 * mf-bridge, served with the real _headers (visual/serve.mjs).
 */
test("the shell and the remote talk over the bridge, and the bridge refuses what it must", async ({ page }) => {
  await page.goto("/micro-frontends");
  const log = page.getByRole("list", { name: "Bridge events" });
  const frame = page.locator("iframe[title='Billing remote']");
  const remote = page.frameLocator("iframe[title='Billing remote']");

  await expect(log).toContainText("Handshake: the remote is ready");
  // The remote runs sandboxed on this origin: its own origin is opaque.
  expect(await frame.getAttribute("sandbox")).toBe("allow-scripts allow-forms");
  expect(await remote.locator("html").evaluate(() => window.origin)).toBe("null");

  // The frame takes the height the remote reports.
  await expect(log).toContainText(/Height: the remote reports \d+ px/);
  const reported = Number(/reports (\d+) px/.exec(await log.innerText())![1]);
  await expect.poll(async () => Math.round((await frame.boundingBox())!.height)).toBe(reported);

  // The theme reaches the remote.
  await page.getByRole("tab", { name: "Dark" }).click();
  await expect(remote.getByText("theme: dark")).toBeVisible();
  await expect(remote.locator("html")).toHaveAttribute("data-theme", "dark");

  // A typed event from the remote reaches the shell.
  await remote.getByRole("button", { name: /INV-4822/ }).click();
  await expect(log).toContainText("Invoice selected: INV-4822, $1260.00");

  // A message posted by the shell's own window, with the right protocol and type, is dropped.
  await page.getByRole("button", { name: "Send a forged message" }).click();
  await expect(log).toContainText("Dropped by the bridge: wrong window");
  expect(Math.round((await frame.boundingBox())!.height)).toBe(reported);

  // A remote that stops answering runs into the request timeout.
  await page.getByRole("button", { name: "Ask the remote for its status" }).click();
  await expect(log).toContainText("Response: 3 open invoices");
  await page.getByRole("button", { name: "Make the remote hang" }).click();
  await expect(log).toContainText('Request failed: bridge: "billing:status" timed out', { timeout: 8000 });

  // The shell ends the session, and the remote clears its content.
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(remote.getByRole("status")).toContainText("The shell ended the session");
});

test("reached by a client-side navigation, the demo still frames the remote: the first page's CSP stays", async ({ page }) => {
  // Production broke here: the home page's CSP had frame-src 'none', and the document keeps it after a soft navigation.
  await page.goto("/");
  // The header's link (inside the closed navigation menu): a Next.js Link, so the router navigates in place.
  await page.locator('a[href="/micro-frontends"]').first().evaluate((a: HTMLAnchorElement) => a.click());
  await expect(page).toHaveURL(/\/micro-frontends$/);
  expect(await page.evaluate(() => new URL(performance.getEntriesByType("navigation")[0].name).pathname)).toBe("/");

  const log = page.getByRole("list", { name: "Bridge events" });
  await expect(log).toContainText("Handshake: the remote is ready");
  await expect(log).toContainText(/Height: the remote reports \d+ px/);
  await expect(page.frameLocator("iframe[title='Billing remote']").getByText("theme: light")).toBeVisible();
});

test("the mf-element widget runs in a shadow root and emits only its declared event", async ({ page }) => {
  await page.goto("/micro-frontends");
  const meter = page.locator("aedis-usage-meter");
  await expect(meter.getByText("72% of the ceiling")).toBeVisible();
  expect(await meter.evaluate((el) => el.shadowRoot !== null)).toBe(true);
  await meter.getByRole("button", { name: "Raise the ceiling" }).click();
  await expect(meter.getByText("62% of the ceiling")).toBeVisible();
  await expect(page.getByRole("list", { name: "Bridge events" })).toContainText("mf-element emitted raise-ceiling");
});
