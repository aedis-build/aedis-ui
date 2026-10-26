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
  "/micro-frontends",
  "/charts",
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
    // The live demo: wait for the remote's handshake and its height report, so the frame has its final size. The log
    // grows with timing, so it is masked, at a fixed height: its length must not move the page around it.
    const live = path === "/micro-frontends" ? [page.getByRole("list", { name: "Bridge events" })] : [];
    if (live.length) {
      await page.getByText("Handshake: the remote is ready").waitFor();
      await page.getByText(/Height: the remote reports/).first().waitFor();
    }
    // Charts animate on enter: the baseline is the settled state. Endless animations (spinners) never settle.
    await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== "running" || a.effect?.getComputedTiming().endTime === Infinity));
    const name = path === "/" ? "home" : path.slice(1).replace(/\//g, "-");
    for (const log of live) await log.evaluate((el: HTMLElement) => Object.assign(el.style, { height: "8rem", maxHeight: "8rem", overflow: "hidden" }));
    await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true, mask: live });
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
