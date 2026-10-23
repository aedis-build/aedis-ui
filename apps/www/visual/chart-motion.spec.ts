import { expect, test, type Page } from "@playwright/test";

/** Chart motion on the built site (#136): it plays, it settles where the static chart is, and reduced motion skips it. */
const marks = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll("main svg [data-enter]")].map((el) => {
      const b = (el as SVGGraphicsElement).getBoundingClientRect();
      return [b.x, b.y, b.width, b.height].map((n) => Math.round(n)).join(",");
    }),
  );
/** Animations whose target is a chart mark (the page has its own entrance animations). */
const onMarks = (page: Page) => page.evaluate(() => document.getAnimations().filter((a) => ((a.effect as KeyframeEffect)?.target as Element | null)?.matches?.("[data-enter]")).length);
const settled = (page: Page) => page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== "running"));
/** Counts every enter animation started on a chart mark, however fast it finishes (polling running ones can miss them). */
const countEnters = (page: Page) =>
  page.addInitScript(() => {
    const animate = Element.prototype.animate;
    (window as unknown as { entered: number }).entered = 0;
    Element.prototype.animate = function (...args) {
      if (this.matches("[data-enter]")) (window as unknown as { entered: number }).entered++;
      return animate.apply(this, args);
    };
  });
const entered = (page: Page) => page.evaluate(() => (window as unknown as { entered: number }).entered);

test("charts animate on enter and on Replay, then rest exactly where the static charts are", async ({ browser }) => {
  const moving = await browser.newPage();
  await countEnters(moving);
  await moving.goto("/charts");
  await expect.poll(() => entered(moving)).toBeGreaterThan(20);
  await settled(moving);
  const after = await marks(moving);

  const still = await browser.newPage({ reducedMotion: "reduce" });
  await still.goto("/charts");
  expect(await marks(still)).toEqual(after);

  const before = await entered(moving);
  await moving.getByRole("button", { name: "Replay" }).click();
  await expect.poll(async () => (await entered(moving)) - before).toBeGreaterThan(20);
  await settled(moving);
  expect(await marks(moving)).toEqual(after);

  // New values: the areas and their lines move from the old shape to the new one.
  await moving.getByRole("tab", { name: "30 days" }).click();
  await expect.poll(() => moving.evaluate(() => document.getAnimations().filter((a) => (a as CSSTransition).transitionProperty === "d").length)).toBe(4);
  await settled(moving);
});

test("under reduced motion nothing runs, on enter or on data change", async ({ browser }) => {
  const page = await browser.newPage({ reducedMotion: "reduce" });
  await page.goto("/charts");
  await page.evaluate(() => document.fonts.ready);
  expect(await onMarks(page)).toBe(0);
  await page.getByRole("tab", { name: "30 days" }).click();
  await page.getByRole("button", { name: "Replay" }).click();
  expect(await onMarks(page)).toBe(0);
  expect(await page.evaluate(() => [...document.querySelectorAll<SVGElement>("main svg [data-enter]")].every((el) => !el.style.transition))).toBe(true);
});

test("the home bar chart grows on enter", async ({ page }) => {
  // Count every animation started on a bar, however fast it finishes.
  await page.addInitScript(() => {
    const animate = Element.prototype.animate;
    (window as unknown as { grown: number }).grown = 0;
    Element.prototype.animate = function (...args) {
      if (this.matches("rect[data-enter=grow]")) (window as unknown as { grown: number }).grown++;
      return animate.apply(this, args);
    };
  });
  await page.goto("/");
  await expect.poll(() => page.evaluate(() => (window as unknown as { grown: number }).grown)).toBe(7);
});
