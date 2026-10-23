import { expect, test } from "@playwright/test";

/** Pages that together show every token: type, color, depth, material, focus and the main components. */
const pages = [
  "/",
  "/docs/theming",
  "/themes",
  "/security",
  "/blocks/usage-limits",
  "/docs/button",
  "/docs/card",
  "/docs/checkbox",
  "/docs/radio-group",
  "/docs/tabs",
  "/docs/alert",
  "/docs/approval-card",
  "/docs/sidebar",
  "/docs/code-block",
  "/docs/navigation-menu",
  "/docs/tool-call",
  "/docs/prompt-input",
];

for (const path of pages) {
  test(`${path} matches its baseline`, async ({ page }, info) => {
    await page.goto(path, { waitUntil: "networkidle" });
    if (info.project.name === "reduced-transparency") await page.evaluate(() => document.documentElement.setAttribute("data-reduced-transparency", ""));
    if (info.project.name === "brand") await page.evaluate(() => document.documentElement.setAttribute("data-theme", "brand"));
    // Code blocks reveal lines when scrolled into view (some sit far down, e.g. in the home gallery), with a timer, and
    // highlight after shiki loads: bring each into view, then wait for the final state.
    for (const block of await page.locator("[data-slot=code-block]").all()) await block.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForFunction(() => document.querySelectorAll("[data-slot=code-block-line]:not([data-shown])").length === 0);
    await page.evaluate(() => document.fonts.ready);
    const name = path === "/" ? "home" : path.slice(1).replace(/\//g, "-");
    await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
  });
}

test("the reduced-transparency hook makes materials solid", async ({ page }, info) => {
  test.skip(info.project.name !== "light", "one project is enough");
  await page.goto("/docs/sidebar");
  const read = (name: string) => page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name);
  expect(await read("--material-thick")).not.toBe(await read("--surface"));
  await page.evaluate(() => document.documentElement.setAttribute("data-reduced-transparency", ""));
  expect(await read("--material-thick")).toBe(await read("--surface"));
  expect(await read("--blur-thick")).toBe("0px");
});
