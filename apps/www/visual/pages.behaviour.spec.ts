import { expect, test } from "./fixtures";

// #163: the site's own pages. The fixture fails any test on an uncaught error, React's hydration errors included.

test("/components hydrates, its cards still link, and its filter is a set of pressed buttons", async ({ page }) => {
  await page.goto("/components");
  await page.waitForTimeout(500);
  const filter = page.getByRole("group", { name: "Category" });
  await expect(filter.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("tablist", { name: "Category" })).toHaveCount(0);
  await filter.getByRole("button", { name: "Forms" }).click();
  await expect(filter.getByRole("button", { name: "Forms" })).toHaveAttribute("aria-pressed", "true");
  // A press on the card's picture follows the card's link.
  const card = page.getByRole("main").locator("li").filter({ has: page.getByRole("link", { name: "Checkbox", exact: true }) });
  await card.locator("[inert]").click({ force: true });
  await expect(page).toHaveURL(/\/docs\/checkbox$/);
});

test("the home showcase: unique ids, labels that act on their own control, and controls that answer", async ({ page }) => {
  await page.goto("/");
  expect(await page.evaluate(() => {
    const ids = [...document.querySelectorAll("[id]")].map((e) => e.id);
    return ids.filter((id, i) => ids.indexOf(id) !== i);
  })).toEqual([]);

  const alerts = page.getByRole("checkbox", { name: "Ceiling alerts" });
  const before = await alerts.getAttribute("aria-checked");
  await page.getByText("Ceiling alerts", { exact: true }).click();
  await expect(alerts).not.toHaveAttribute("aria-checked", before!);

  await page.getByRole("button", { name: "Approve →" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Approved." })).toBeVisible();
  await page.getByRole("button", { name: "Revoke…" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Revoke" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Access revoked" })).toBeVisible();

  const ceiling = page.getByRole("spinbutton", { name: "Monthly ceiling (USD)" });
  await ceiling.fill("50");
  await expect(page.getByText("Enter an amount from $100 to $10,000.")).toBeVisible();
  await ceiling.fill("2000");
  await page.getByRole("button", { name: "Save ceiling" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Ceiling saved: $2,000" })).toBeVisible();

  const nav = page.getByRole("navigation", { name: "Workspace (example)" });
  await nav.getByRole("link", { name: "Usage" }).click();
  await expect(nav.getByRole("link", { name: "Usage" })).toHaveAttribute("aria-current", "page");
});

test("/directory does not scroll sideways at 390 px and announces its results", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/directory");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const live = page.locator("main [aria-live=polite]").first();
  const all = await live.innerText();
  await page.getByRole("group", { name: "Registries" }).getByRole("button", { name: "Community" }).click();
  await expect(live).not.toHaveText(all);
});

test("a one-line command keeps its last characters clear of the copy button at 390 px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/create");
  const block = page.locator("main [data-slot=code-block]").first();
  const pre = block.locator("pre");
  await pre.evaluate((el) => (el.scrollLeft = el.scrollWidth));
  const text = await block.locator("[data-slot=code-block-line]").first().evaluate((line) => {
    const range = document.createRange();
    range.selectNodeContents(line);
    const rects = [...range.getClientRects()];
    return Math.max(...rects.map((r) => r.right));
  });
  const button = (await block.getByRole("button", { name: "Copy code" }).boundingBox())!;
  expect(text).toBeLessThanOrEqual(button.x);
});

test("/create: framework, level and blocks change the preview, not only the command", async ({ page }) => {
  await page.goto("/create");
  const preview = page.locator("[data-slot=create-preview]");
  await page.getByRole("tab", { name: "Vite" }).click();
  await expect(preview).toContainText("Vite app");
  await page.getByText("L3 Regulated").click();
  await expect(preview).toContainText("L3 Regulated");
  await expect(preview.getByText("Usage", { exact: true })).toBeVisible();
  await page.getByRole("checkbox", { name: "Usage and ceilings" }).click();
  await expect(preview.getByText("Usage", { exact: true })).toHaveCount(0);
});

test("/themes confirms a successful import", async ({ page }) => {
  await page.goto("/themes");
  const json = await page.getByLabel("Export").inputValue();
  await page.getByLabel("Import").fill(json.replace(/"name": "[^"]*"/, '"name": "Imported test"'));
  await page.getByRole("button", { name: "Import theme" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Imported “Imported test”" })).toBeVisible();
});

test("usage-limits: bars show their state, the phone frame shows every card, and block views have one main", async ({ page }) => {
  await page.goto("/blocks/view/usage-limits");
  const fills = await page.locator("[data-slot=progress-indicator]").evaluateAll((all) => [...new Set(all.map((el) => getComputedStyle(el).backgroundColor))]);
  expect(fills.length).toBeGreaterThanOrEqual(2);
  for (const name of ["agent-console", "approval-inbox", "secure-shell", "usage-limits"]) {
    await page.goto(`/blocks/view/${name}`);
    await expect(page.locator("main")).toHaveCount(1);
  }

  await page.goto("/blocks/usage-limits");
  await page.getByRole("tab", { name: "Mobile" }).click();
  const frame = page.getByRole("main").locator("iframe").first();
  await expect.poll(async () => {
    const outer = (await frame.boundingBox())!.height;
    const inner = await frame.evaluate((f: HTMLIFrameElement) => f.contentDocument!.querySelector("main")!.getBoundingClientRect().height);
    return outer + 1 >= inner;
  }).toBe(true);
});
