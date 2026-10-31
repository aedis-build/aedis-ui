import { expect, test } from "./fixtures";

// #191: motion that only reveals content, driven by the reader's own scroll.

test("steps below the fold are revealed as the page scrolls to them", async ({ page }) => {
  await page.goto("/docs/scroll-motion");
  const step = page.getByRole("main").locator("[data-slot=reveal]").filter({ hasText: "We ship the one you choose." }).first();
  await expect(step).toHaveAttribute("data-state", "hidden");
  expect(await step.evaluate((el) => getComputedStyle(el).opacity)).toBe("0");
  await step.scrollIntoViewIfNeeded();
  await expect(step).not.toHaveAttribute("data-state", "hidden");
  await expect.poll(() => step.evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
});

test("the content is in the page without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/docs/scroll-motion");
  const step = page.getByRole("main").getByText("We ship the one you choose.").first();
  await step.scrollIntoViewIfNeeded();
  await expect(step).toBeVisible();
  await context.close();
});

test("the poster drifts against the scroll, by transform only", async ({ page }) => {
  await page.goto("/docs/scroll-motion");
  const layer = page.getByRole("main").locator("[data-slot=parallax]").first();
  await layer.scrollIntoViewIfNeeded();
  const y = () => layer.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m42);
  const before = await y();
  await page.mouse.wheel(0, 300);
  await expect.poll(y).toBeLessThan(before);
});

test("the pinned section holds and reports its progress as the page scrolls", async ({ page }) => {
  await page.goto("/docs/scroll-motion");
  const pin = page.getByRole("main").locator("[data-slot=pin]").first();
  await pin.scrollIntoViewIfNeeded();
  const word = pin.locator(".text-title-1");
  const top = await pin.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  await page.evaluate((t) => window.scrollTo(0, t), top);
  await expect(word).toHaveText("Listen");
  const inner = pin.locator(":scope > div");
  const at = async () => (await inner.boundingBox())!.y;
  await page.evaluate((t) => window.scrollTo(0, t + window.innerHeight * 0.75), top);
  await expect(pin.getByText(/^5\d% through$/)).toBeVisible();
  expect(Math.abs(await at())).toBeLessThan(2);
  await page.evaluate((t) => window.scrollTo(0, t + window.innerHeight * 1.6), top);
  await expect(word).toHaveText("Ship");
});

test("with reduced motion nothing hides or moves, and the pin is in its final state", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/docs/scroll-motion");
  const main = page.getByRole("main");
  await expect(main.locator("[data-slot=reveal][data-state=hidden]")).toHaveCount(0);
  expect(await main.locator("[data-slot=parallax]").first().evaluate((el) => getComputedStyle(el).transform)).toBe("none");
  await expect(main.locator("[data-slot=pin]").first().getByText("100% through")).toBeVisible();
});

test("fits a 390 px screen in dark", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/scroll-motion");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

// #225: a pin gated by a media query, driven by the page.
const exhibition = (page: import("@playwright/test").Page) => page.getByRole("main").locator("[data-slot=pin]").filter({ has: page.getByRole("list", { name: "Exhibition" }) });

test("on a narrow screen the gated pin is a plain section", async ({ page }) => {
  await page.setViewportSize({ width: 600, height: 800 });
  await page.goto("/docs/scroll-motion");
  await expect(page.getByRole("main").getByText(/^A plain section/)).toBeVisible();
  await expect(exhibition(page)).not.toHaveAttribute("data-pinned");
  expect(await exhibition(page).evaluate((el) => el.style.height)).toBe("");
});

test("on a wide screen it pins, and scrollTo(0.5) lands halfway through its run", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/docs/scroll-motion");
  const pin = exhibition(page);
  await expect(pin).toHaveAttribute("data-pinned", "true");
  await expect(page.getByRole("main").getByText(/^Pinned:/)).toBeVisible();
  await page.getByRole("navigation", { name: "Rooms" }).getByRole("button", { name: "Posters" }).click();
  await expect(pin.getByText(/^(49|50|51)% through$/)).toBeVisible();
  // Polled: lazy media above the pin can still settle just after the scroll lands.
  const off = () => pin.evaluate((el: HTMLElement) => Math.abs(window.scrollY - (el.getBoundingClientRect().top + window.scrollY + (el.offsetHeight - window.innerHeight) / 2)));
  await expect.poll(off).toBeLessThan(4);
  await expect(pin.getByRole("listitem").filter({ hasText: "Posters" })).toHaveAttribute("data-current", "true");
});

test("without JavaScript the gated pin is a plain section with every room", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  await page.goto("/docs/scroll-motion");
  const pin = exhibition(page);
  await expect(pin).not.toHaveAttribute("data-pinned");
  expect(await pin.evaluate((el) => el.getAttribute("style"))).toBeNull();
  await expect(pin.getByRole("listitem").filter({ hasText: "Shop" })).toBeAttached();
  await context.close();
});

// #240: one progress primitive, native and fallback, and the effects and stage built on it.
type Page = import("@playwright/test").Page;
const column = (page: Page, name: "Native" | "Fallback") => page.getByRole("main").getByRole("group", { name, exact: true });

/** Each effect's state in a column, as a progress from 0 to 1 read back from its computed style. */
const effects = (page: Page, name: "Native" | "Fallback") =>
  column(page, name).evaluate((root) => {
    const style = (sel: string) => getComputedStyle(root.querySelector(sel)!);
    const scale = (t: string) => (t === "none" ? 1 : new DOMMatrix(t).a);
    const inset = style("[data-slot=curtain]").clipPath;
    const top = inset === "none" ? 0 : parseFloat(inset.slice(inset.indexOf("(") + 1));
    return {
      bar: scale(style("[data-part=bar]").transform),
      curtain: 1 - top / 12,
      dolly: 1 - (scale(style("[data-slot=dolly] > div").transform) - 1) / 0.18,
      draw: 1 - (parseFloat(style("[data-slot=draw] path").strokeDashoffset) || 0),
    };
  });
const settle = (page: Page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

test("native and fallback give the same values at the same scroll positions, within 1%", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/docs/scroll-motion");
  const native = column(page, "Native");
  await expect(native.locator("[data-slot=curtain]")).toHaveAttribute("data-scroll-mode", "native");
  await expect(column(page, "Fallback").locator("[data-slot=curtain]")).toHaveAttribute("data-scroll-mode", "fallback");
  const top = await native.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  const height = await native.evaluate((el) => el.getBoundingClientRect().height);
  const seen = new Set<string>();
  for (let k = 0; k <= 12; k++) {
    await page.evaluate((y) => window.scrollTo(0, y), top - 800 + (k * (height + 800)) / 12);
    await settle(page);
    const [n, f] = [await effects(page, "Native"), await effects(page, "Fallback")];
    for (const key of Object.keys(n) as (keyof typeof n)[]) {
      expect(Math.abs(n[key] - f[key]), `${key} at step ${k}: native ${n[key]}, fallback ${f[key]}`).toBeLessThanOrEqual(0.01);
      if (n[key] > 0.02 && n[key] < 0.98) seen.add(key);
    }
  }
  // Every effect was compared part-way, not only at its ends.
  expect([...seen].sort()).toEqual(["bar", "curtain", "dolly", "draw"]);
});

test("the stage holds while its layers play: the title zooms away and the next line rises out of its blur", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/docs/scroll-motion");
  const stage = page.getByRole("main").locator("[data-slot=scroll-stage]");
  await expect(stage).toHaveAttribute("data-staged", "true");
  const title = stage.getByText("Premiere", { exact: true });
  const next = stage.locator("[data-part=next]").locator("..");
  const at = async (vh: number) => {
    // Measured just before scrolling, twice: content above (lazy media, the gated pin) can still change height.
    for (let i = 0; i < 2; i++) {
      await stage.evaluate((el, vh) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY + vh * window.innerHeight), vh);
      await settle(page);
    }
    return {
      scale: await title.locator("..").evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a),
      next: Number(await next.evaluate((el) => getComputedStyle(el).opacity)),
      held: Math.abs((await stage.locator(":scope > div").boundingBox())!.y),
    };
  };
  const [start, half, end] = [await at(0), await at(0.5), await at(1.95)];
  // On screen and as wide as its column, not just laid out.
  expect((await stage.locator(":scope > div").boundingBox())!.width).toBeGreaterThan(400);
  await expect(stage.locator("[data-part=next]")).toBeInViewport();
  expect(start.scale).toBeCloseTo(1, 2);
  expect(half.scale).toBeCloseTo(6.5, 1);
  expect(start.next).toBe(0);
  expect(end.next).toBe(1);
  for (const s of [start, half, end]) expect(s.held).toBeLessThan(1);
});

test("with reduced motion every effect shows its end state and the stage has no runway", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/docs/scroll-motion");
  for (const name of ["Native", "Fallback"] as const) {
    await column(page, name).scrollIntoViewIfNeeded();
    expect(await effects(page, name)).toEqual({ bar: 1, curtain: 1, dolly: 1, draw: 1 });
  }
  const stage = page.getByRole("main").locator("[data-slot=scroll-stage]");
  await expect(stage).not.toHaveAttribute("data-staged");
  expect((await stage.boundingBox())!.height).toBeCloseTo(800, 0);
  await expect(stage.getByText("Now showing: the studio, in three acts.")).toBeVisible();
});

test("without JavaScript the effects and the stage show all their content", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  await page.goto("/docs/scroll-motion");
  const native = column(page, "Native");
  await native.scrollIntoViewIfNeeded();
  await expect(native.getByRole("img", { name: "Green signage by the greenhouse door" })).toBeVisible();
  expect(await effects(page, "Native")).toEqual({ bar: 1, curtain: 1, dolly: 1, draw: 1 });
  const stage = page.getByRole("main").locator("[data-slot=scroll-stage]");
  expect(await stage.getAttribute("style")).toBeNull();
  await expect(stage.getByText("Premiere", { exact: true })).toBeVisible();
  await context.close();
});

test("the effects fit a 390 px screen, side by side", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/scroll-motion");
  const [n, f] = [(await column(page, "Native").boundingBox())!, (await column(page, "Fallback").boundingBox())!];
  expect(f.x).toBeGreaterThan(n.x + n.width - 1);
  expect(f.x + f.width).toBeLessThanOrEqual(390);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
