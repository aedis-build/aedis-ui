import { expect, test } from "./fixtures";

// #199: the marketing blocks as a visitor meets them, on their block pages and full views.

test("the hero reads as a page top: h1, lead, actions that navigate, and a reel with a pause button", async ({ page }) => {
  await page.goto("/blocks/view/hero");
  await expect(page.getByRole("heading", { level: 1, name: "Brands that people remember" })).toBeVisible();
  await expect(page.getByText("Identity, websites and film for small companies with a lot to say.")).toBeVisible();
  const pause = page.getByRole("button", { name: "Pause video" });
  await expect(pause).toBeVisible({ timeout: 8000 });
  await pause.click();
  await expect(page.getByRole("button", { name: "Play video" })).toBeVisible();
  await page.getByRole("link", { name: "See the work" }).click();
  await expect(page).toHaveURL(/\/blocks\/proof-list$/);
});

test("the hero's copy is in the page without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/blocks/view/hero");
  await expect(page.getByRole("heading", { level: 1, name: "Brands that people remember" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Start a project" })).toBeVisible();
  await context.close();
});

test("the CTA leaves out the action whose URL is refused, and the keyboard reaches the rest", async ({ page }) => {
  await page.goto("/blocks/view/cta-section");
  await expect(page.getByRole("heading", { level: 2, name: "Have a project in mind?" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Hidden" })).toHaveCount(0);
  await expect(page.locator("a[href^='javascript:']")).toHaveCount(0);
  await page.getByRole("link", { name: "Start a project" }).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Email us" })).toBeFocused();
});

test("the logo cloud names every client, and the proof list reads term then numeral", async ({ page }) => {
  await page.goto("/blocks/view/logo-cloud");
  const list = page.getByRole("region", { name: "Trusted by" }).getByRole("list");
  await expect(list.getByRole("listitem")).toHaveCount(6);
  await expect(list.getByRole("img", { name: "Bakery" })).toBeVisible();
  await expect(list.getByText("Wine bar")).toBeVisible();
  await page.goto("/blocks/view/proof-list");
  await expect(page.getByRole("term").first()).toHaveText("Years in practice");
  await expect(page.getByRole("definition").first()).toHaveText("12");
});

test("every marketing block page fits 390 px in dark, and the hero stacks its media under the copy", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.setViewportSize({ width: 390, height: 844 });
  for (const name of ["hero", "logo-cloud", "cta-section", "proof-list"]) {
    await page.goto(`/blocks/${name}`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth), name).toBeLessThanOrEqual(390);
  }
  await page.goto("/blocks/view/hero");
  const h1 = (await page.getByRole("heading", { level: 1 }).boundingBox())!;
  const media = (await page.locator("[data-slot=hero] [data-slot=video]").boundingBox())!;
  expect(media.y).toBeGreaterThan(h1.y + h1.height);
});

// #256: a highlighted end of the headline, part of the one h1.
test("the hero has one h1 named by the whole sentence, its last line in the highlight colour", async ({ page }) => {
  await page.goto("/blocks/view/hero");
  const h1 = page.getByRole("heading", { level: 1 });
  await expect(h1).toHaveCount(1);
  await expect(h1).toHaveAccessibleName("Brands that people remember, from the first mark to the last film.");
  const highlight = h1.locator("[data-slot=hero-highlight]");
  await expect(highlight).toHaveText("from the first mark to the last film.");
  const [colour, token, display] = await highlight.evaluate((el) => [getComputedStyle(el).color, getComputedStyle(el).getPropertyValue("--highlight").trim(), getComputedStyle(el).display]);
  expect(token).not.toBe("");
  expect(colour).not.toBe(await h1.evaluate((el) => getComputedStyle(el).color));
  expect(display).toBe("block");
});

// #258: a row of logos with no title, split by hairlines that never open or close a line.
for (const width of [1280, 390]) {
  test(`at ${width} px the logo row is named without a title, and no line starts or ends with a divider`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/blocks/view/logo-cloud");
    const row = page.getByRole("region", { name: "Stack" });
    await expect(row).toBeVisible();
    await expect(row.getByRole("heading")).toHaveCount(0);
    const lines = await row.locator("ul").evaluate((ul) => {
      const clip = ul.parentElement!.getBoundingClientRect();
      const items = [...ul.children].map((li) => ({ r: li.getBoundingClientRect(), border: getComputedStyle(li).borderLeftWidth, right: getComputedStyle(li).borderRightWidth }));
      const byLine = new Map<number, typeof items>();
      for (const it of items) byLine.set(Math.round(it.r.top), [...(byLine.get(Math.round(it.r.top)) ?? []), it]);
      // A line opens with no divider: the first logo has none, and on a wrapped line it sits past the clipping box's edge.
      return [...byLine.values()].map((line) => ({ firstClipped: line[0]!.border === "0px" || line[0]!.r.left < clip.left, lastRight: line.at(-1)!.right, count: line.length }));
    });
    if (width === 390) expect(lines.length).toBeGreaterThan(1);
    for (const l of lines) {
      expect(l.firstClipped).toBe(true);
      expect(l.lastRight).toBe("0px");
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  });
}
