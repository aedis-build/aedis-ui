import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";

// #244: the line's end and the nodes answer to one reading head, at 55% of the viewport.
const steps = (page: Page) => page.getByRole("main").locator("[data-slot=scroll-steps]");
const settle = (page: Page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

for (const width of [390, 768, 1440]) {
  for (const mode of ["native", "fallback"] as const) {
    test(`at ${width} px, ${mode}: the line ends at the head and exactly the nodes above it are done`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/docs/scroll-steps");
      if (mode === "fallback") await page.getByRole("main").getByRole("switch", { name: "Force the JavaScript fallback" }).click();
      const line = steps(page).locator("[data-slot=scroll-steps-line]");
      await expect(line.locator("div")).toHaveAttribute("data-scroll-mode", mode);
      const head = 0.55 * 800;
      for (const share of [0.1, 0.3, 0.5, 0.7, 0.9]) {
        // Put the head `share` of the way down the line, measuring again in case the layout above has moved.
        for (let i = 0; i < 2; i++) {
          await line.evaluate((el, [share, head]) => {
            const r = el.getBoundingClientRect();
            window.scrollTo(0, window.scrollY + r.top + share! * r.height - head!);
          }, [share, head]);
          await settle(page);
        }
        const m = await steps(page).evaluate((root) => {
          const fill = root.querySelector("[data-slot=scroll-steps-line] > div")!.getBoundingClientRect();
          const nodes = [...root.querySelectorAll<HTMLElement>(":scope > ol > li")].map((li) => {
            const n = li.querySelector("[data-slot=scroll-step-node]")!.getBoundingClientRect();
            return { centre: n.top + n.height / 2, state: li.dataset.state };
          });
          return { end: fill.bottom, nodes };
        });
        expect(Math.abs(m.end - head), `line end at ${share}`).toBeLessThanOrEqual(2);
        for (const n of m.nodes) {
          if (Math.abs(n.centre - head) < 1) continue;
          expect(n.state, `node at ${n.centre}, head ${head}`).toBe(n.centre < head ? "done" : "pending");
        }
      }
    });
  }
}

test("with reduced motion every step is done and the line is full", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/docs/scroll-steps");
  await expect(steps(page).locator("li[data-state=pending]")).toHaveCount(0);
  const [line, fill] = await steps(page).evaluate((root) => [root.querySelector("[data-slot=scroll-steps-line]")!, root.querySelector("[data-slot=scroll-steps-line] > div")!].map((e) => e.getBoundingClientRect().height));
  expect(fill).toBeCloseTo(line!, 0);
});

test("without JavaScript the steps are in the page, done", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/docs/scroll-steps");
  await expect(steps(page).getByText("How to hire us")).toBeAttached();
  await expect(steps(page).locator("li[data-state=done]")).toHaveCount(5);
  await context.close();
});

test("fits a 390 px screen in dark", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/scroll-steps");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
