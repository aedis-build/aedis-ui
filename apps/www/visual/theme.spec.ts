import { expect, test } from "@playwright/test";

/** Pages that together show every token: type, color, depth, material, focus and the main components. */
const pages = [
  "/",
  "/docs/theming",
  "/themes",
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
    // Code blocks reveal lines with a timer and highlight after shiki loads: wait for the final state.
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

test("radio and checkbox indicators sit in the centre of their control", async ({ page }, info) => {
  test.skip(info.project.name !== "light", "one project is enough");
  for (const [path, slot] of [["/docs/radio-group", "radio-group-item"], ["/docs/checkbox", "checkbox"]] as const) {
    await page.goto(path);
    const root = page.locator(`[data-slot=${slot}]`).first();
    if (slot === "checkbox") await root.click();
    const outer = await root.boundingBox();
    const inner = await root.locator("[data-slot$=indicator]").boundingBox();
    if (!outer || !inner) throw new Error(`${slot}: no box`);
    expect(Math.abs(inner.x + inner.width / 2 - (outer.x + outer.width / 2))).toBeLessThan(0.5);
    expect(Math.abs(inner.y + inner.height / 2 - (outer.y + outer.height / 2))).toBeLessThan(0.5);
  }
});
