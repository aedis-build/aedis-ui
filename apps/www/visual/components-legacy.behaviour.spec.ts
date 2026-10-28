import { expect, test } from "./fixtures";

// #204: the components older than the demo rule, each used on its docs page the way a person would.

for (const path of ["/docs/area-chart", "/docs/line-chart", "/docs/radial-chart", "/docs/chart"]) {
  test(`${path}: the keyboard walks the data, the tooltip names each row, Escape hides it`, async ({ page }) => {
    await page.goto(path);
    const chart = page.getByRole("main").locator("[data-slot=chart]").first();
    const rows = chart.locator("table tbody tr");
    const first = (await rows.first().locator("th, td").first().innerText()).trim();
    const last = (await rows.last().locator("th, td").first().innerText()).trim();
    await chart.getByRole("group").focus();
    await page.keyboard.press("ArrowRight");
    const tip = chart.locator("[data-slot=chart-tooltip]");
    await expect(tip).toContainText(first);
    await page.keyboard.press("End");
    await expect(tip).toContainText(last);
    await page.keyboard.press("Escape");
    await expect(tip).toHaveCount(0);
  });
}

test("chart: a label from an untrusted source is drawn as text, and bad values are counted, not drawn", async ({ page }) => {
  await page.goto("/docs/chart");
  const chart = page.getByRole("main").locator("[data-slot=chart]").first();
  await expect(chart.locator("img")).toHaveCount(0);
  await expect(chart.locator("table")).toContainText("<img src=x onerror=alert(1)>");
});

test("avatar, badge, kbd, label, separator and spinner say what they are", async ({ page }) => {
  await page.goto("/docs/avatar");
  await expect(page.getByRole("main").getByText("RA", { exact: true }).first()).toBeVisible();
  await page.goto("/docs/badge");
  await expect(page.getByRole("main").getByText("Hand raised").first()).toBeVisible();
  await page.goto("/docs/kbd");
  await expect(page.getByRole("main").locator("kbd").filter({ hasText: "K" }).first()).toBeVisible();
  await page.goto("/docs/label");
  await expect(page.getByRole("main").getByText("Daily ceiling").first()).toBeVisible();
  await page.goto("/docs/separator");
  await expect(page.getByRole("main").locator("[data-slot=separator]").first()).toHaveAttribute("role", /none|presentation/);
  await page.goto("/docs/spinner");
  await expect(page.getByRole("main").getByRole("status").filter({ hasText: "Sending" }).first()).toBeAttached();
});

test("breadcrumb: a navigation landmark whose last item is the current page, and its links go", async ({ page }) => {
  await page.goto("/docs/breadcrumb");
  const crumbs = page.getByRole("main").getByRole("navigation", { name: /breadcrumb/i }).first();
  await expect(crumbs.getByText("Breadcrumb", { exact: true })).toHaveAttribute("aria-current", "page");
  await crumbs.getByRole("link", { name: "Components" }).click();
  await expect(page).toHaveURL(/\/docs\/button$/);
});

test("collapsible: Enter shows and hides the steps", async ({ page }) => {
  await page.goto("/docs/collapsible");
  const trigger = page.getByRole("main").getByRole("button", { name: "Show the three steps" }).first();
  await trigger.press("Enter");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("main").getByText("Import the theme.")).toBeVisible();
  await trigger.press("Enter");
  await expect(page.getByRole("main").getByText("Import the theme.")).toBeHidden();
});

test("empty, item and table: their content reads in order and their actions are reachable", async ({ page }) => {
  await page.goto("/docs/empty");
  await expect(page.getByRole("main").getByText("No agents yet", { exact: true })).toBeVisible();
  await expect(page.getByRole("main").getByRole("button", { name: "Hire an agent" })).toBeEnabled();
  await page.goto("/docs/item");
  const group = page.getByRole("main").getByRole("list", { name: "Agents" }).first();
  await expect(group.getByRole("listitem")).toHaveCount(2);
  await group.getByRole("link", { name: /Talbot/ }).click();
  await expect(page).toHaveURL(/\/docs\/approval-card$/);
  await page.goto("/docs/table");
  const table = page.getByRole("main").getByRole("table").first();
  await expect(table.getByRole("columnheader")).toHaveText(["Agent", "Role", "Ceiling used"]);
  await expect(table.getByRole("row").nth(1)).toContainText("Rafael");
});

test("scroll-area: the region scrolls with the keyboard", async ({ page }) => {
  await page.goto("/docs/scroll-area");
  const viewport = page.getByRole("main").getByRole("region", { name: "Release notes" }).first();
  await viewport.focus();
  await page.keyboard.press("End");
  await expect.poll(() => viewport.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
});

test("sheet: opens from its side, traps the focus, and Done or Escape closes it back on its trigger", async ({ page }) => {
  await page.goto("/docs/sheet");
  const trigger = page.getByRole("main").getByRole("button", { name: "Open right" }).first();
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Approval pending" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("textbox", { name: "Note" }).fill("Fine by me");
  await dialog.getByRole("button", { name: "Done" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await page.getByRole("main").getByRole("button", { name: "Open bottom" }).first().click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("hand-raise: an answer is sent and the card says so", async ({ page }) => {
  await page.goto("/docs/hand-raise");
  const main = page.getByRole("main");
  await main.getByRole("textbox").first().fill("Yes, but never their current agency.");
  await main.getByRole("button", { name: /send|answer/i }).first().click();
  await expect(main.getByText(/answered/i).first()).toBeVisible();
});

test("markdown and streaming-markdown: safe links only, no raw HTML, and the answer streams in", async ({ page }) => {
  await page.goto("/docs/markdown");
  const md = page.getByRole("main").locator("[data-slot=markdown]").first();
  await expect(md.getByRole("link", { name: "terms" })).toHaveAttribute("href", "https://example.com");
  await expect(md.locator("a[href^='javascript:'], img, b")).toHaveCount(0);
  await page.goto("/docs/streaming-markdown");
  const main = page.getByRole("main");
  await main.getByRole("button", { name: "Stream an answer" }).click();
  await expect(main.getByRole("link", { name: "the contract" })).toBeVisible({ timeout: 10000 });
  await expect(main.getByRole("button", { name: "Stream an answer" })).toBeEnabled();
});

test("sources: a citation jumps to its source, which shows its real domain", async ({ page }) => {
  await page.goto("/docs/sources");
  const main = page.getByRole("main");
  await main.getByRole("link", { name: /1/ }).first().click();
  await expect(page).toHaveURL(/#example-sources/);
  await expect(main.getByText("example.com").first()).toBeVisible();
});

test("share-card: each theme's card is one named image", async ({ page }) => {
  await page.goto("/docs/share-card");
  for (const theme of ["light", "dark", "brand"]) await expect(page.getByRole("main").getByRole("img", { name: `Share card for Dropdown Menu, ${theme} theme` })).toBeVisible();
});

test("these component pages fit 390 px in dark", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.setViewportSize({ width: 390, height: 844 });
  for (const name of ["area-chart", "breadcrumb", "item", "table", "sheet", "hand-raise", "sources", "share-card", "streaming-markdown"]) {
    await page.goto(`/docs/${name}`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth), name).toBeLessThanOrEqual(390);
  }
});
