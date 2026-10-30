import { createRequire } from "node:module";

import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";

// #243: the panels open with a real, slow change of width, on the built docs page.
const row = (page: Page) => page.getByRole("main").locator("[data-slot=image-accordion]").first();
const panel = (page: Page, name: string) => row(page).getByRole("button", { name });
const width = async (page: Page, name: string) => (await panel(page, name).boundingBox())!.width;
// The default minOpen, min(440px, 56cqi), in pixels for this row.
const minOpen = async (page: Page) => Math.min(440, 0.56 * (await row(page).boundingBox())!.width);
// Records a panel's size on every frame, in the page, so the whole curve is seen and not two guesses at it.
const sample = (page: Page, name: string, axis: "width" | "height") =>
  panel(page, name).evaluate((el, axis) => {
    const out: [number, number][] = [];
    const t0 = performance.now();
    const tick = () => {
      out.push([performance.now() - t0, el.getBoundingClientRect()[axis]]);
      if (performance.now() - t0 < 1100) requestAnimationFrame(tick);
    };
    tick();
    const w = window as unknown as { samples: typeof out; enteredAt: number };
    w.samples = out;
    w.enteredAt = NaN;
    el.addEventListener("pointerenter", () => (w.enteredAt = performance.now() - t0), { once: true });
  }, axis);
const samples = async (page: Page) => {
  await page.waitForTimeout(1200);
  return page.evaluate(() => (window as unknown as { samples: [number, number][] }).samples);
};
const enteredAt = (page: Page) => page.evaluate(() => (window as unknown as { enteredAt: number }).enteredAt);
/** The frames strictly between two sizes, and how long the move took from its first frame to its last. */
const motion = (s: [number, number][], from: number, to: number) => {
  const between = s.filter(([, v]) => v > Math.min(from, to) + 1 && v < Math.max(from, to) - 1);
  return { frames: between.length, ms: between.length ? between.at(-1)![0] - between[0]![0] : 0, values: s.map(([, v]) => v) };
};

test.use({ bypassCSP: true });
// Timing is the subject here: one page at a time, so the frames come at the display's pace.
test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
});

test("the width grows smoothly: part-way 150 ms after the hover, frame by frame, to the readable minimum", async ({ page }) => {
  await page.goto("/docs/image-accordion");
  await expect(panel(page, "Craft")).toHaveAttribute("aria-expanded", "true");
  const closed = await width(page, "Use");
  const open = await width(page, "Craft");
  expect(open).toBeGreaterThanOrEqual((await minOpen(page)) - 1);

  await sample(page, "Use", "width");
  await panel(page, "Use").hover();
  const s = await samples(page);
  // Shut through the 100 ms of intent, then it starts to move within ~150 ms, from near where it was.
  const hover = await enteredAt(page);
  expect(s.find(([t]) => t >= hover + 90)![1]).toBeCloseTo(closed, 0);
  const [start, first] = s.find(([, v]) => v > closed + 1)!;
  expect(start - hover).toBeLessThan(250);
  expect(first).toBeLessThan(closed + 0.35 * (open - closed));
  // Never a jump: it grows on many frames, never shrinks on the way, and takes half a second or more.
  const m = motion(s, closed, open);
  expect(m.frames).toBeGreaterThanOrEqual(4);
  expect(m.ms).toBeGreaterThanOrEqual(350);
  expect(m.values.every((v, i) => i === 0 || v >= m.values[i - 1]! - 0.5)).toBe(true);
  for (let i = 1; i < s.length; i++) expect(s[i]![1] - s[i - 1]![1], `frame ${i}`).toBeLessThan(0.35 * (open - closed));

  await expect(panel(page, "Use")).toHaveAttribute("aria-expanded", "true");
  await expect.poll(() => width(page, "Use")).toBeCloseTo(open, 0);
  expect(await width(page, "Use")).toBeGreaterThanOrEqual((await minOpen(page)) - 1);
  expect(await width(page, "Craft")).toBeCloseTo(closed, 0);
});

test("changing panels mid-way carries on from where it is, without a jump", async ({ page }) => {
  await page.goto("/docs/image-accordion");
  const closed = await width(page, "Use");
  await panel(page, "Use").hover();
  await page.waitForTimeout(300);
  const reached = await width(page, "Use");
  expect(reached).toBeGreaterThan(closed + 4);

  await panel(page, "Listen").hover();
  await page.waitForTimeout(150);
  // Listen has opened, and Use is on its way back from where it had got to, not snapped shut.
  await expect(panel(page, "Listen")).toHaveAttribute("aria-expanded", "true");
  const shrinking = await width(page, "Use");
  expect(shrinking).toBeLessThanOrEqual(reached + 1);
  expect(shrinking).toBeGreaterThan(closed + 2);
});

test("sweeping the pointer across the row opens nothing on the way", async ({ page }) => {
  await page.goto("/docs/image-accordion");
  const boxes = await Promise.all(["Place", "Use", "Listen", "Shape"].map(async (n) => (await panel(page, n).boundingBox())!));
  for (const b of boxes) await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.move(0, 0);
  await page.waitForTimeout(200);
  await expect(panel(page, "Craft")).toHaveAttribute("aria-expanded", "true");
});

test("with reduced motion the panel opens at once", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/docs/image-accordion");
  const open = await width(page, "Craft");
  await panel(page, "Use").hover();
  await expect(panel(page, "Use")).toHaveAttribute("aria-expanded", "true");
  // No transition: the next frame already has the final width.
  await page.evaluate(() => new Promise(requestAnimationFrame));
  expect(await width(page, "Use")).toBeCloseTo(open, 0);
  expect(await panel(page, "Use").evaluate((e) => getComputedStyle(e).transitionProperty)).toBe("none");
});

for (const w of [768, 1024, 1440]) {
  test(`at ${w} px the open panel keeps its readable width and the row never overflows`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto("/docs/image-accordion");
    for (const name of ["Craft", "Hand over"]) {
      await panel(page, name).click();
      await expect.poll(async () => (await width(page, name)) >= (await minOpen(page)) - 1).toBe(true);
    }
    const r = await row(page).evaluate((el) => ({ scroll: el.scrollWidth, client: el.clientWidth, right: el.getBoundingClientRect().right }));
    expect(r.scroll).toBeLessThanOrEqual(r.client);
    expect(r.right).toBeLessThanOrEqual(w);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(w);
  });
}

test("the keyboard reaches the open panel and the arrow keys open the others", async ({ page }) => {
  await page.goto("/docs/image-accordion");
  await page.getByRole("main").getByRole("button", { name: "Talk to us" }).first().focus();
  await page.keyboard.press("Tab");
  await expect(panel(page, "Craft")).toBeFocused();
  for (const name of ["Place", "Use", "Listen", "Shape", "Hand over"]) {
    await page.keyboard.press("ArrowRight");
    await expect(panel(page, name)).toBeFocused();
    await expect(panel(page, name)).toHaveAttribute("aria-expanded", "true");
  }
  await page.keyboard.press("Home");
  await expect(panel(page, "Craft")).toHaveAttribute("aria-expanded", "true");
});

test("on a phone the panels stack, and the open one's height eases too", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/image-accordion");
  const [a, b] = [(await panel(page, "Craft").boundingBox())!, (await panel(page, "Place").boundingBox())!];
  expect(b.y).toBeGreaterThanOrEqual(a.y + a.height);
  expect(a.height).toBeCloseTo(0.52 * 844, -1);
  expect(b.height).toBeCloseTo(64, 0);
  await sample(page, "Place", "height");
  await panel(page, "Place").click();
  const m = motion(await samples(page), 64, 0.52 * 844);
  expect(m.frames, m.values.join(" ")).toBeGreaterThanOrEqual(4);
  expect(m.ms).toBeGreaterThanOrEqual(350);
  await expect.poll(async () => (await panel(page, "Place").boundingBox())!.height).toBeCloseTo(0.52 * 844, -1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test("axe finds no WCAG A/AA violation in the accordion", async ({ page }) => {
  await page.goto("/docs/image-accordion", { waitUntil: "networkidle" });
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve("axe-core/axe.min.js") });
  const found = await row(page).evaluate(async (el) => {
    const axe = (window as unknown as { axe: { run: (c: unknown, o: unknown) => Promise<{ violations: { id: string }[] }> } }).axe;
    return (await axe.run(el, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } })).violations.map((v) => v.id);
  });
  expect(found).toEqual([]);
});
