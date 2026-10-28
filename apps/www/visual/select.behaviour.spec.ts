import { expect, test } from "./fixtures";

// #196: choosing one option, with the mouse and with the keyboard.

test("the select opens from the keyboard, skips the disabled option and picks with Enter", async ({ page }) => {
  await page.goto("/docs/select");
  const trigger = page.getByRole("main").getByRole("combobox", { name: "Proposal" }).first();
  await expect(trigger).toHaveText(/Choose a proposal/);
  await trigger.focus();
  await page.keyboard.press("Enter");
  const listbox = page.getByRole("listbox");
  await expect(listbox).toBeVisible();
  await expect(listbox.getByRole("group", { name: "Closed" })).toBeVisible();
  await expect(listbox.getByRole("option", { name: "Gallery catalogue" })).toHaveAttribute("aria-disabled", "true");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(listbox).toBeHidden();
  await expect(trigger).toHaveText(/Bakery website|Ceramics studio identity/);
  await expect(trigger).toBeFocused();
});

test("the select picks with the mouse, and Escape closes it without a change", async ({ page }) => {
  await page.goto("/docs/select");
  const main = page.getByRole("main");
  const trigger = main.getByRole("combobox", { name: "Proposal" }).first();
  await trigger.click();
  await page.getByRole("option", { name: "Bakery website" }).click();
  await expect(trigger).toHaveText(/Bakery website/);
  await expect(main.getByText("The portfolio goes with p-14.")).toBeVisible();
  await trigger.click();
  await expect(page.getByRole("option", { name: "Bakery website" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("listbox")).toBeHidden();
  await expect(trigger).toHaveText(/Bakery website/);
});

test("the combobox filters as a person types and picks with the arrows and Enter", async ({ page }) => {
  await page.goto("/docs/combobox");
  const main = page.getByRole("main");
  const input = main.getByRole("combobox", { name: "Sector" }).first();
  await input.click();
  await page.keyboard.type("fu");
  await expect(page.getByRole("option")).toHaveText(["Furniture"]);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(input).toHaveValue("Furniture");
  await expect(main.getByText("Sends sector=furniture.")).toBeVisible();

  await input.fill("zzz");
  await expect(page.getByText("No results.")).toBeVisible();
});

test("the combobox opens from its button with the mouse, a button named for what it does", async ({ page }) => {
  await page.goto("/docs/combobox");
  await page.getByRole("main").getByRole("button", { name: "Show options" }).first().click();
  await expect(page.getByRole("option")).toHaveCount(10);
  await page.getByRole("option", { name: "Wine" }).click();
  await expect(page.getByRole("main").getByRole("combobox", { name: "Sector" }).first()).toHaveValue("Wine");
});

test("select and combobox lists stay on a 390 px screen, in dark too", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [path, open] of [["/docs/select", "combobox"], ["/docs/combobox", "button"]] as const) {
    await page.goto(path);
    const main = page.getByRole("main");
    await (open === "combobox" ? main.getByRole("combobox", { name: "Proposal" }) : main.getByRole("button", { name: "Show options" })).first().click();
    const list = page.getByRole("listbox");
    await expect(list).toBeVisible();
    const box = (await list.boundingBox())!;
    expect(box.x, path).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width, path).toBeLessThanOrEqual(390);
    expect(await page.evaluate(() => document.documentElement.scrollWidth), path).toBeLessThanOrEqual(390);
  }
});
