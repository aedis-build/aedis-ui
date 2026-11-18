import { expect, test } from "./fixtures";

// #277: radio cards with an icon, a title and a description, used as a person would.

const open = async (page: import("@playwright/test").Page) => {
  await page.goto("/docs/radio-group");
  const main = page.getByRole("main");
  return { main, product: main.getByRole("radiogroup", { name: "Product" }), appType: main.getByRole("radiogroup", { name: "Application type" }) };
};

test("a click anywhere on a card checks it, and the selection shows without moving the card", async ({ page }) => {
  const { main, appType } = await open(page);
  const agent = appType.getByRole("radio", { name: /^AI agent/ });
  await agent.scrollIntoViewIfNeeded();
  const before = (await agent.boundingBox())!;
  await agent.getByText("Acts for a person").click();
  await expect(agent).toHaveAttribute("aria-checked", "true");
  await expect(main.getByText("Selected: Identity, AI agent.")).toBeVisible();
  const after = (await agent.boundingBox())!;
  expect(after).toEqual(before);
  // Selected is drawn by an inset ring as well as the border colour.
  expect(await agent.evaluate((el) => getComputedStyle(el).boxShadow)).toContain("inset");
});

test("each group is one tab stop; arrows move and check, skip disabled cards, and focus is visible", async ({ page }) => {
  const { main, product, appType } = await open(page);
  const identity = product.getByRole("radio", { name: /^Identity/ });
  await identity.focus();
  await page.keyboard.press("ArrowRight");
  const compliance = product.getByRole("radio", { name: /^Compliance/ });
  await expect(compliance).toBeFocused();
  await expect(compliance).toHaveAttribute("aria-checked", "true");
  expect(await compliance.evaluate((el) => getComputedStyle(el).outlineStyle)).not.toBe("none");
  await page.keyboard.press("ArrowRight");
  await expect(identity).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(appType.getByRole("radio", { name: /^Server app/ })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(main.getByText("Selected: Identity, SPA or mobile.")).toBeVisible();
});

test("a contracted-only card is unavailable, readable and says why", async ({ page }) => {
  const { product } = await open(page);
  const keys = product.getByRole("radio", { name: /^Managed keys/ });
  await expect(keys).toHaveAttribute("aria-disabled", "true");
  await expect(keys.getByText("Contracted with our team")).toBeVisible();
  expect(Number(await keys.evaluate((el) => getComputedStyle(el).opacity))).toBe(1);
  await keys.click({ force: true });
  await expect(keys).toHaveAttribute("aria-checked", "false");
});

test("at 390 px the cards stack in one column and fit the screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const { product } = await open(page);
  const [a, b] = [product.getByRole("radio", { name: /^Identity/ }), product.getByRole("radio", { name: /^Compliance/ })];
  const [ba, bb] = [(await a.boundingBox())!, (await b.boundingBox())!];
  expect(bb.y).toBeGreaterThan(ba.y + ba.height - 1);
  expect(ba.x + ba.width).toBeLessThanOrEqual(390);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
