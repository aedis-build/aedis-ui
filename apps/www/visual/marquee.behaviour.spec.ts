import { expect, test } from "./fixtures";

// #248: the endless line, on the built docs page.
const sign = (page: import("@playwright/test").Page) => page.getByRole("main").locator("[data-slot=marquee][data-variant=sign]").first();

test("the loop is seamless: the second copy starts exactly half the track along, and the track slides that half", async ({ page }) => {
  await page.goto("/docs/marquee");
  for (const track of await page.getByRole("main").locator("[data-slot=marquee-track]").all()) {
    const m = await track.evaluate((el) => {
      const [first, second] = el.children as unknown as HTMLElement[];
      const anim = el.getAnimations()[0]!;
      const frames = (anim.effect as KeyframeEffect).getKeyframes().map((k) => k.transform);
      // Rects, not offsets: the copies are a fraction of a pixel wide, and a rounded offset would hide a real jump.
      const [t, a, b] = [el, first!, second!].map((n) => n.getBoundingClientRect());
      return { half: t!.width / 2, second: b!.left - t!.left, first: a!.width, frames, running: anim.playState };
    });
    expect(m.second).toBeCloseTo(m.half, 2);
    expect(m.first).toBeCloseTo(m.half, 2);
    expect(m.frames).toEqual([expect.stringMatching(/^translateX\(0(px)?\)$/), "translateX(-50%)"]);
    expect(m.running).toBe("running");
  }
});

test("the sign pauses on hover and with its button, and screen readers get each item once", async ({ page }) => {
  await page.goto("/docs/marquee");
  const line = sign(page);
  const state = () => line.locator("[data-slot=marquee-track]").evaluate((el) => el.getAnimations()[0]!.playState);
  await line.hover();
  await expect.poll(state).toBe("paused");
  await page.mouse.move(0, 0);
  await expect.poll(state).toBe("running");

  await line.getByRole("button", { name: "Pause the moving line" }).press("Enter");
  await expect.poll(state).toBe("paused");
  await page.mouse.move(0, 0);
  await page.keyboard.press("Tab");
  await expect.poll(state).toBe("paused");

  const items = await line.getByRole("listitem").allTextContents();
  expect(items.map((t) => t.replace(" ·", ""))).toEqual(["Brand identity", "Campaigns", "Packaging", "Editorial design", "Motion", "Websites", "Photography"]);
  // The backdrop is decoration: nothing of it is exposed.
  const backdrop = page.getByRole("main").locator("[data-slot=marquee][data-variant=backdrop]");
  await expect(backdrop).toHaveAttribute("aria-hidden", "true");
  expect(await backdrop.getByRole("listitem").count()).toBe(0);
});

test("with reduced motion the lines stand still, cut at the edge, and there is no pause button", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/docs/marquee");
  const line = sign(page);
  expect(await line.locator("[data-slot=marquee-track]").evaluate((el) => el.getAnimations().length)).toBe(0);
  await expect(line.getByRole("button")).toHaveCount(0);
  expect(await line.locator("[data-slot=marquee-lines]").evaluate((el) => getComputedStyle(el).overflow)).toBe("hidden");
});

test("the docs page fits a 390 px screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/marquee");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
