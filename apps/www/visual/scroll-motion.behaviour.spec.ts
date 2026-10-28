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
  const { top, run, y } = await pin.evaluate((el: HTMLElement) => ({ top: el.getBoundingClientRect().top + window.scrollY, run: el.offsetHeight - window.innerHeight, y: window.scrollY }));
  expect(Math.abs(y - (top + run / 2))).toBeLessThan(4);
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
