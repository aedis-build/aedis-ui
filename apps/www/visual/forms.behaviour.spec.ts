import type { Locator } from "@playwright/test";

import { expect, test } from "./fixtures";

// #161: form controls as a person uses them. Each check failed on main at 41d5382.

/** True when a press at (dx, dy) from the control's edge still lands on it. */
const hits = (control: Locator, dx: number, dy: number) =>
  control.evaluate((el, [dx, dy]) => {
    const r = el.getBoundingClientRect();
    const x = dx < 0 ? r.left + dx : dx > 0 ? r.right + dx : r.left + r.width / 2;
    const y = dy < 0 ? r.top + dy : dy > 0 ? r.bottom + dy : r.top + r.height / 2;
    const at = document.elementFromPoint(x, y);
    return !!at && (at === el || el.contains(at));
  }, [dx, dy] as const);

test("the switch thumb stays centred at a 20 px root font size", async ({ page }) => {
  await page.goto("/docs/switch");
  await page.evaluate(() => (document.documentElement.style.fontSize = "20px"));
  const control = page.getByRole("main").getByRole("switch").first();
  const thumb = control.locator("[data-slot=switch-thumb]");
  const gaps = async () => {
    const [t, b] = [(await control.boundingBox())!, (await thumb.boundingBox())!];
    return { left: b.x - t.x, right: t.x + t.width - (b.x + b.width), top: b.y - t.y, bottom: t.y + t.height - (b.y + b.height) };
  };
  const off = await gaps();
  await control.click();
  await page.waitForTimeout(800);
  const on = await gaps();
  // The gap on the side the thumb rests against is the same checked and unchecked.
  expect(Math.abs(Math.min(off.left, off.right) - Math.min(on.left, on.right))).toBeLessThanOrEqual(0.5);
  expect(Math.abs(off.top - off.bottom)).toBeLessThanOrEqual(0.5);
});

test("checkbox, switch and radio take a press just outside what they draw (24 px targets)", async ({ page }) => {
  for (const [path, role] of [["/docs/checkbox", "checkbox"], ["/docs/switch", "switch"], ["/docs/radio-group", "radio"]] as const) {
    await page.goto(path);
    const control = page.getByRole("main").getByRole(role).first();
    await control.scrollIntoViewIfNeeded();
    expect(await hits(control, 0, -1.5), `${role} above`).toBe(true);
    expect(await hits(control, 0, 1.5), `${role} below`).toBe(true);
  }
});

test("text fields drop hidden characters as typed, and say so when a paste is cut", async ({ page }) => {
  await page.goto("/docs/textarea");
  const box = page.getByRole("main").getByRole("textbox").first();
  await box.fill("");
  await box.pressSequentially("pay\u202Eyap");
  await expect(box).toHaveValue("payyap");

  await page.goto("/docs/input");
  const input = page.getByRole("main").getByRole("textbox").first();
  const max = Number(await input.getAttribute("maxlength"));
  await input.fill("");
  await input.focus();
  await input.evaluate((el: HTMLInputElement, text) => {
    const data = new DataTransfer();
    data.setData("text", text);
    el.dispatchEvent(new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }));
  }, "x".repeat(max + 10));
  expect(await input.evaluate((el: HTMLInputElement) => el.validationMessage)).toContain(`first ${max} characters`);
});

test("a disabled field's label is dimmed, and the button group seam is one line", async ({ page }) => {
  await page.goto("/docs/input");
  const disabled = page.getByRole("main").locator("input:disabled").first();
  const label = page.getByRole("main").locator(`label[for="${await disabled.getAttribute("id")}"]`);
  expect(Number(await label.evaluate((el) => getComputedStyle(el).opacity))).toBeLessThan(1);

  await page.goto("/docs/button-group");
  const separator = page.getByRole("main").locator("[data-slot=button-group-separator]").first();
  const before = separator.locator("xpath=preceding-sibling::*[1]");
  expect(await before.evaluate((el) => getComputedStyle(el).borderRightWidth)).toBe("0px");
});

test("the localized region carries its language", async ({ page }) => {
  await page.goto("/docs/locale-switcher");
  const card = page.getByRole("main").locator("[data-slot=approval-card]").first();
  expect(await card.evaluate((el) => el.closest("[lang]")?.getAttribute("lang"))).toBe("pt-BR");
});
