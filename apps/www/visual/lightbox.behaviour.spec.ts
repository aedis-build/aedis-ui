import { expect, test } from "./fixtures";

// #195 and #270: opening a work full screen and moving through the group, with the mouse and the keyboard.

test("a click opens the work as a dialog named by its title; arrows move; Esc returns to the thumbnail", async ({ page }) => {
  await page.goto("/docs/lightbox");
  const thumb = page.getByRole("main").getByRole("button", { name: "Green signage by the greenhouse door" }).first();
  await thumb.click();
  const dialog = page.getByRole("dialog", { name: "Garden centre" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("2 of 4");
  await expect(dialog).toContainText("Wayfinding, 2025");
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("dialog", { name: "Bakery website" })).toContainText("3 of 4");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByRole("dialog", { name: "Hotel campaign" })).toContainText("4 of 4");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(thumb).toBeFocused();
});

test("the keyboard opens it, Tab stays inside, and the buttons move and close", async ({ page }) => {
  await page.goto("/docs/lightbox");
  await page.getByRole("main").getByRole("button", { name: "Shop sign in terracotta and cream" }).first().focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);
  }
  await dialog.getByRole("button", { name: "Next" }).click();
  await expect(page.getByRole("dialog", { name: "Garden centre" })).toBeVisible();
  await dialog.getByRole("button", { name: "Close" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("the image grows out of its thumbnail and back into it as a view transition, and not with reduced motion", async ({ page }) => {
  // Records which element carries the shared name as each transition starts, however fast it ends on a slow machine.
  await page.addInitScript(() => {
    const w = window as unknown as { morphs: string[] };
    w.morphs = [];
    const start = document.startViewTransition?.bind(document);
    if (!start) return;
    document.startViewTransition = ((update: () => void) => {
      const named = document.querySelector<HTMLElement>("[style*='view-transition-name']");
      w.morphs.push(named?.dataset.slot ?? named?.tagName.toLowerCase() ?? "none");
      return start(update);
    }) as typeof document.startViewTransition;
  });
  const morphs = () => page.evaluate(() => (window as unknown as { morphs: string[] }).morphs);
  const thumb = () => page.getByRole("main").getByRole("button", { name: "Blue home page on a phone" }).first();
  await page.goto("/docs/lightbox");
  await thumb().click();
  await expect(page.getByRole("dialog").getByRole("img", { name: "Blue home page on a phone" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(thumb()).toBeFocused();
  expect(await morphs()).toEqual(["button", "lightbox-media"]);
  // The name lives only for the transition: nothing keeps it afterwards.
  await expect(page.locator("[style*='view-transition-name: lightbox-item']")).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/docs/lightbox");
  await thumb().click();
  await expect(page.getByRole("dialog").getByRole("img", { name: "Blue home page on a phone" })).toBeVisible();
  expect(await morphs()).toEqual([]);
});

test("at 390 px a short drag down springs back, a long one closes and the focus returns to the thumbnail", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/lightbox");
  const thumb = page.getByRole("main").getByRole("button", { name: "Shop sign in terracotta and cream" }).first();
  await thumb.click();
  const dialog = page.getByRole("dialog", { name: "Ceramics studio" });
  const image = dialog.getByRole("img", { name: "Shop sign in terracotta and cream" });
  await expect(image).toBeVisible();
  const start = (await image.boundingBox())!;
  const x = start.x + start.width / 2;
  const y = start.y + start.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + 60, { steps: 6 });
  // The item follows the pointer and the blurred backdrop fades with the distance.
  expect((await image.boundingBox())!.y).toBeGreaterThan(start.y + 40);
  expect(Number(await page.locator('[data-slot="dialog-overlay"]').evaluate((o) => getComputedStyle(o).opacity))).toBeLessThan(1);
  expect(await page.locator('[data-slot="dialog-overlay"]').evaluate((o) => getComputedStyle(o).backdropFilter)).toContain("blur");
  await page.mouse.up();
  await expect.poll(async () => Math.round((await image.boundingBox())!.y)).toBe(Math.round(start.y));
  await expect(dialog).toBeVisible();
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + 200, { steps: 10 });
  await page.mouse.up();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(thumb).toBeFocused();
});

test("with reduced motion a drag does not move the item, and past 120 px it still closes", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/docs/lightbox");
  await page.getByRole("main").getByRole("button", { name: "Gold poster in a hotel lobby" }).first().click();
  const image = page.getByRole("dialog").getByRole("img", { name: "Gold poster in a hotel lobby" });
  await expect(image).toBeVisible();
  const start = (await image.boundingBox())!;
  const x = start.x + start.width / 2;
  const y = start.y + start.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + 200, { steps: 10 });
  expect((await image.boundingBox())!.y).toBe(start.y);
  await page.mouse.up();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("full screen at 390 px in dark: the image, the caption and the buttons all fit", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/lightbox");
  await page.getByRole("main").getByRole("button", { name: "Gold poster in a hotel lobby" }).first().click();
  const dialog = page.getByRole("dialog", { name: "Hotel campaign" });
  await expect(dialog).toBeVisible();
  const box = (await dialog.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(390);
  expect(box.y + box.height).toBeLessThanOrEqual(844);
  await expect(dialog.getByRole("button", { name: "Next" })).toBeInViewport();
  const image = (await dialog.getByRole("img", { name: "Gold poster in a hotel lobby" }).boundingBox())!;
  expect(image.height).toBeGreaterThan(200);
  expect(image.y + image.height).toBeLessThanOrEqual(box.y + box.height);
});

// #269: photos and films in the same group.

test("a film opens in the player without playing, and is paused before it leaves when the person moves on or closes", async ({ page }) => {
  // Removing a video from the page also stops it, so only a pause() while it is still there proves the explicit stop.
  await page.addInitScript(() => {
    const pause = HTMLMediaElement.prototype.pause;
    (window as unknown as { pausedInPage: number }).pausedInPage = 0;
    HTMLMediaElement.prototype.pause = function () {
      if (this.isConnected && !this.paused) (window as unknown as { pausedInPage: number }).pausedInPage++;
      return pause.call(this);
    };
  });
  const pausedInPage = () => page.evaluate(() => (window as unknown as { pausedInPage: number }).pausedInPage);
  const start = (video: ReturnType<typeof page.locator>) =>
    // Stands in for the press on the browser's play control, whose position differs per browser.
    video.evaluate((v: HTMLVideoElement) => ((v.muted = true), v.play()));
  await page.goto("/docs/lightbox");
  const thumb = page.getByRole("main").getByRole("button", { name: "Studio showreel video" });
  await thumb.click();
  const dialog = page.getByRole("dialog", { name: "Studio film" });
  await expect(dialog).toContainText("2 of 3");
  const video = dialog.locator("video");
  await expect(video).toHaveAttribute("aria-label", "Studio showreel");
  await expect(video).toHaveAttribute("controls", "");
  expect(await video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
  await start(video);
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(false);
  await dialog.getByRole("button", { name: "Next" }).click();
  await expect(page.getByRole("dialog", { name: "Hotel campaign" })).toBeVisible();
  expect(await pausedInPage()).toBe(1);
  await page.keyboard.press("ArrowLeft");
  await expect(dialog.locator("video")).toBeVisible();
  await start(dialog.locator("video"));
  await expect.poll(() => dialog.locator("video").evaluate((v: HTMLVideoElement) => v.paused)).toBe(false);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(await pausedInPage()).toBe(2);
  await expect(thumb).toBeFocused();
});

test("a drag on the film is left to its controls and does not close the lightbox", async ({ page }) => {
  await page.goto("/docs/lightbox");
  await page.getByRole("main").getByRole("button", { name: "Studio showreel video" }).click();
  const dialog = page.getByRole("dialog", { name: "Studio film" });
  const box = (await dialog.locator("video").boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + 10);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + 250, { steps: 10 });
  await page.mouse.up();
  await expect(dialog).toBeVisible();
});

test("in the player, the arrows stay with the film instead of moving to another item", async ({ page }) => {
  await page.goto("/docs/lightbox");
  await page.getByRole("main").getByRole("button", { name: "Studio showreel video" }).click();
  const dialog = page.getByRole("dialog", { name: "Studio film" });
  await dialog.locator("video").focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("dialog", { name: "Studio film" })).toBeVisible();
});

test("a film fits the screen at 390 px, letterboxed, with its controls in view", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/lightbox");
  await page.getByRole("main").getByRole("button", { name: "Studio showreel video" }).click();
  const dialog = page.getByRole("dialog", { name: "Studio film" });
  const video = dialog.locator("video");
  await expect(video).toBeInViewport({ ratio: 1 });
  const frame = (await dialog.boundingBox())!;
  const box = (await video.boundingBox())!;
  // The player takes the film's 16:9: the full width of the dialog and its height from that, controls on the picture.
  expect(frame.width - box.width).toBeLessThan(40);
  expect(Math.abs(box.width / box.height - 16 / 9)).toBeLessThan(0.05);
  expect(box.y).toBeGreaterThanOrEqual(frame.y);
  expect(box.y + box.height).toBeLessThanOrEqual(frame.y + frame.height);
  const next = (await dialog.getByRole("button", { name: "Next" }).boundingBox())!;
  expect(box.y + box.height).toBeLessThanOrEqual(next.y);
  expect(await video.evaluate((v) => getComputedStyle(v).objectFit)).toBe("contain");
  await expect(dialog.getByRole("button", { name: "Next" })).toBeInViewport();
});
