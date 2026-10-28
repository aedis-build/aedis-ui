import { expect, test } from "./fixtures";

// #204: the micro-frontend kit's docs pages, each with the live remote or its own demo.

test("mf-frame: the remote loads in the frame, reports its height, and the frame follows it", async ({ page }) => {
  await page.goto("/docs/mf-frame");
  const main = page.getByRole("main");
  await expect(main.getByText(/^The remote reported \d+ px; the frame follows it\.$/)).toBeVisible({ timeout: 10000 });
  const frame = main.locator("iframe[title='Billing remote']");
  await expect(frame).toHaveAttribute("sandbox", /allow-scripts/);
  const reported = Number((await main.getByText(/The remote reported/).textContent())!.match(/\d+/)![0]);
  await expect.poll(async () => Math.round((await frame.boundingBox())!.height)).toBeGreaterThanOrEqual(Math.min(reported, 600) - 2);
});

test("mf-bridge: a forged message is dropped, and the remote answers a status request", async ({ page }) => {
  await page.goto("/docs/mf-bridge");
  const main = page.getByRole("main");
  await expect(main.getByText("Handshake: the remote is ready")).toBeVisible({ timeout: 10000 });
  await main.getByRole("button", { name: "Send a forged message" }).click();
  await expect(main.getByText(/^Dropped by the bridge/).first()).toBeVisible();
  await main.getByRole("button", { name: "Ask the remote for its status" }).click();
  await expect(main.getByText(/status/i).nth(1)).toBeVisible();
});

test("mf-context: the remote follows the shell's theme, and Sign out ends its session", async ({ page }) => {
  await page.goto("/docs/mf-context");
  const main = page.getByRole("main");
  await expect(main.getByText("Handshake: the remote is ready")).toBeVisible({ timeout: 10000 });
  const remote = page.frameLocator("iframe[title='Billing remote']");
  await main.getByRole("tab", { name: "Dark" }).click();
  await expect(remote.getByText("theme: dark")).toBeVisible();
  await main.getByRole("button", { name: "Sign out" }).click();
  await expect(main.getByText("Session ended: sent session:end")).toBeVisible();
});

test("mf-element: an attribute flows in and an event flows out of the custom element", async ({ page }) => {
  await page.goto("/docs/mf-element");
  const main = page.getByRole("main");
  const element = main.locator("demo-greeting");
  await expect(element.getByText("Hello, Ana.")).toBeVisible();
  await main.getByRole("textbox", { name: "name attribute" }).fill("Bruno");
  await expect(element.getByText("Hello, Bruno.")).toBeVisible();
  await element.getByRole("button", { name: "Wave back" }).click();
  await expect(main.getByText("Host heard: wave to Bruno")).toBeVisible();
});

test("mf-embed-headers: each side frames only the other, and a wildcard never gets through", async ({ page }) => {
  await page.goto("/docs/mf-embed-headers");
  const main = page.getByRole("main");
  const rules = main.getByRole("definition");
  await expect(rules.filter({ hasText: "frame-src" })).toContainText("frame-src https://agent.example.com");
  await expect(rules.filter({ hasText: "frame-ancestors https://backoffice.example.com" })).toHaveCount(1);
  await main.getByRole("textbox", { name: "Host origin" }).fill("https://*.example.com");
  // A wildcard host is dropped: nobody may frame the embedded app.
  await expect(rules.filter({ hasText: "frame-ancestors" })).toHaveText(["frame-ancestors 'none'", "frame-ancestors 'none'"]);
});

test("the micro-frontend pages fit 390 px in dark", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.setViewportSize({ width: 390, height: 844 });
  for (const name of ["mf-frame", "mf-bridge", "mf-context", "mf-element", "mf-embed-headers"]) {
    await page.goto(`/docs/${name}`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth), name).toBeLessThanOrEqual(390);
  }
});
