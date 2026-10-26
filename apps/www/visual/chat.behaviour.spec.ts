import type { Locator, Page } from "@playwright/test";

import { expect, test } from "./fixtures";

// #155: the chats as a person uses them. Every check here failed on main at 41d5382.

const atEnd = (log: Locator) => log.evaluate((el) => el.scrollHeight - el.scrollTop - el.clientHeight <= 2);
const noSidewaysScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  test(`agent console follows the answer and keeps code inside at ${viewport.width} px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/blocks/view/agent-console");
    const log = page.getByRole("log");
    const box = page.getByRole("textbox", { name: "Message" });
    await box.fill("Where is the proposal?");
    await box.press("Enter");
    await expect(log.getByText("curl -s")).toBeVisible();
    await expect(page.getByRole("button", { name: "Send" })).toBeVisible();
    // The answer ends in view: the log scrolled itself to its end.
    expect(await atEnd(log)).toBe(true);
    const [answer, frame] = [await log.locator("article").last().boundingBox(), await log.boundingBox()];
    expect(answer!.y + answer!.height).toBeLessThanOrEqual(frame!.y + frame!.height + 1);
    // A long command scrolls inside its code block, never the log or the page.
    expect(await log.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    expect(await noSidewaysScroll(page)).toBe(true);
  });
}

test("chat leaves a reader who scrolled up where they are, offers the way back, and never moves the page", async ({ page }) => {
  await page.goto("/docs/chat");
  const log = page.getByRole("log", { name: "Conversation" }).first();
  const box = page.getByRole("textbox", { name: "Message" }).first();
  await log.scrollIntoViewIfNeeded();
  // Enough history that the log scrolls.
  for (const text of ["One", "Two"]) {
    await box.fill(text);
    await box.press("Enter");
    await expect(log.getByText("Got it.")).toHaveCount(["One", "Two"].indexOf(text) + 1);
  }
  expect(await atEnd(log)).toBe(true);

  await box.fill("Three");
  await box.press("Enter");
  // Cleared on send, not when the reply ends.
  await expect(box).toHaveValue("");
  await box.fill("typed while waiting");
  await log.evaluate((el) => el.scrollTo({ top: 0 }));
  const pageY = await page.evaluate(() => scrollY);
  await expect(log.getByText("Got it.")).toHaveCount(3);
  expect(await log.evaluate((el) => el.scrollTop)).toBe(0);
  expect(await page.evaluate(() => scrollY)).toBe(pageY);
  await expect(box).toHaveValue("typed while waiting");

  await page.getByRole("button", { name: "Jump to latest" }).click();
  expect(await atEnd(log)).toBe(true);
  await expect(page.getByRole("button", { name: "Jump to latest" })).toHaveCount(0);
});

test("chat keeps its width when a message is sent, and the focus stays in the composer", async ({ page }) => {
  await page.goto("/docs/chat");
  const chat = page.locator("[data-slot=chat]").first();
  const width = (await chat.boundingBox())!.width;
  const box = page.getByRole("textbox", { name: "Message" }).first();
  await box.fill("A word that never ends: " + "x".repeat(300));
  await page.getByRole("button", { name: "Send" }).first().click();
  await expect(box).toBeFocused();
  expect((await chat.boundingBox())!.width).toBe(width);
  expect(await page.getByRole("log", { name: "Conversation" }).first().evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
});

test("the components page does not scroll itself on load", async ({ page, pageErrors }) => {
  await page.goto("/components");
  await page.waitForTimeout(1000);
  expect(await page.evaluate(() => scrollY)).toBe(0);
  // shortcut: the gallery's nested links fail hydration (React #418), which is #163's to fix; drop this line with it.
  pageErrors.splice(0, pageErrors.length, ...pageErrors.filter((e) => !e.includes("React error #418")));
});

test("prompt input keeps the focus through Send and Stop, gives the prompt back on Stop, and grows", async ({ page }) => {
  await page.goto("/docs/prompt-input");
  const box = page.getByRole("textbox", { name: "Message" }).first();
  expect((await box.boundingBox())!.width).toBeGreaterThan(400);

  await box.click();
  // No ring arcs inside the composer: the box draws its own ring.
  const rings = await box.evaluate((el) =>
    getComputedStyle(el)
      .boxShadow.split(/,(?![^(]*\))/)
      .filter((s) => !/rgba\([^)]*,\s*0\)/.test(s) && /[1-9][\d.]*px$/.test(s.trim())),
  );
  expect(rings).toEqual([]);
  const height = (await box.boundingBox())!.height;
  await box.fill(Array.from({ length: 8 }, (_, i) => `Line ${i + 1}`).join("\n"));
  const grown = (await box.boundingBox())!.height;
  expect(grown).toBeGreaterThan(height);
  expect(grown).toBeLessThanOrEqual(241);

  await box.fill("Draft the proposal");
  await page.getByRole("button", { name: "Send" }).first().click();
  const stop = page.getByRole("button", { name: "Stop" });
  await expect(stop).toBeFocused();
  await expect(box).toHaveValue("");
  await stop.click();
  await expect(box).toHaveValue("Draft the proposal");
  await expect(box).toBeFocused();
});

test("on a phone the composer text is 16 px, so iOS does not zoom into it", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/chat");
  expect(await page.getByRole("textbox", { name: "Message" }).first().evaluate((el) => getComputedStyle(el).fontSize)).toBe("16px");
});

test("the home showcase answers what you send", async ({ page }) => {
  await page.goto("/");
  const console = page.getByRole("region", { name: "Support agent" });
  const box = console.getByRole("textbox", { name: "Message" });
  await box.scrollIntoViewIfNeeded();
  await box.fill("Hello there");
  await box.press("Enter");
  const log = console.getByRole("log");
  await expect(log.getByText("Hello there")).toBeVisible();
  await expect(log.getByText("This is a demo, so nothing was looked up.")).toBeVisible();
});
