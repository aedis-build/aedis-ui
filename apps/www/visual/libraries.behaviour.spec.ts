import { expect, test } from "./fixtures";

// #204: the libraries and hooks older than the demo rule, used through their demos.

test("api: JSON in, 204 as no content, 403 and an HTML answer as ApiError", async ({ page }) => {
  await page.goto("/docs/api");
  const main = page.getByRole("main");
  const last = main.getByRole("log", { name: "Requests" }).locator("li").first();
  await main.getByRole("button", { name: "Load approvals" }).click();
  await expect(last).toHaveText('Load: [{"id":42,"title":"Send the October report"}]');
  await main.getByRole("button", { name: "Approve #42" }).click();
  await expect(last).toHaveText("Approve: done, no content");
  await expect(main.getByText(/POST \/demo-api\/approvals\/42\/approve · X-Requested-With: XMLHttpRequest · X-CSRF-Token: demo-7f3a/)).toBeVisible();
  await main.getByRole("button", { name: "Open admin" }).click();
  await expect(last).toHaveText(/^Admin: ApiError 403/);
  await main.getByRole("button", { name: "Get a login page" }).click();
  await expect(last).toHaveText(/^HTML: ApiError 200 \(Expected JSON, got text\/html/);
});

test("untrusted: hidden characters shown and stripped, a javascript: link refused", async ({ page }) => {
  await page.goto("/docs/untrusted");
  const main = page.getByRole("main");
  await expect(main.getByText("[U+E0049][U+E0047]")).toBeVisible();
  await expect(main.getByText("Pay the invoice today", { exact: true })).toBeVisible();
  await expect(main.getByText("safeUrl: refused")).toBeVisible();
  await main.getByRole("textbox", { name: "A link" }).fill("https://rlfn.studio/work");
  await expect(main.getByText("https://rlfn.studio/work").last()).toBeVisible();
});

test("redact: keys and bearer tokens hidden as the arguments are edited", async ({ page }) => {
  await page.goto("/docs/redact");
  const main = page.getByRole("main");
  const shown = main.getByRole("status", { name: "Redacted" });
  await expect(shown).toContainText('"apiKey": "[redacted]"');
  await expect(shown).not.toContainText("sk-live-41f9");
  await main.getByRole("textbox", { name: "Tool arguments (JSON or text)" }).fill("curl -H 'Authorization: Bearer abc.def.ghi' password=hunter2");
  await expect(shown).not.toContainText("hunter2");
});

test("secure-action: each call's result, read tab by tab with the keyboard", async ({ page }) => {
  await page.goto("/docs/secure-action");
  const main = page.getByRole("main");
  const panel = (name: string) => main.getByRole("tabpanel", { name });
  await expect(panel("Signed out")).toContainText('{"ok":false,"code":"unauthorized"}');
  await main.getByRole("tab", { name: "Signed out" }).focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await expect(panel("Invalid name")).toContainText('{"ok":false,"code":"invalid","fields":["name"]}');
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await expect(panel("Too large")).toContainText('"code":"too-large"');
  await main.getByRole("tab", { name: "Valid", exact: true }).click();
  await expect(panel("Valid")).toContainText('{"ok":true,"data":{"renamedTo":"Sales agent","by":"ana"}}');
});

test("bff-stream: the API gets the server's token, the browser gets only the events", async ({ page }) => {
  await page.goto("/docs/bff-stream");
  const main = page.getByRole("main");
  const signedIn = main.getByRole("tabpanel", { name: "Signed in" });
  await expect(signedIn).toContainText("Authorization: Bearer token-kept-on-the-server");
  await expect(signedIn).toContainText("Cookie: (none)");
  await expect(signedIn).not.toContainText("forged-by-the-page");
  await main.getByRole("tab", { name: "No session" }).click();
  await expect(main.getByRole("tabpanel", { name: "No session" })).toContainText("401");
});

test("event-stream and use-event-stream: a simulated stream opens, delivers and closes", async ({ page }) => {
  await page.goto("/docs/event-stream");
  let main = page.getByRole("main");
  await main.getByRole("button", { name: "Start the task" }).click();
  await expect(main.getByRole("status").first()).toHaveText("Stream: closed · 100%", { timeout: 8000 });
  await page.goto("/docs/use-event-stream");
  main = page.getByRole("main");
  await main.getByRole("switch", { name: "Follow the agent" }).press("Space");
  await expect(main.getByRole("list", { name: "Messages" }).getByRole("listitem")).toHaveText(["Reading the brief", "Drafting three directions", "Picking the strongest one"], { timeout: 8000 });
});

test("use-idle-timeout: fast-forward warns, Stay keeps the session, stillness signs out", async ({ page }) => {
  await page.goto("/docs/use-idle-timeout");
  const main = page.getByRole("main");
  await main.getByRole("button", { name: "Fast-forward: 6 seconds" }).click();
  await expect(main.getByText("You will be signed out soon.")).toBeVisible({ timeout: 6000 });
  await main.getByRole("button", { name: "Stay signed in" }).click();
  await expect(main.getByText(/^Signed in\./)).toBeVisible();
  await expect(main.getByText("Signed out after the quiet spell.")).toBeVisible({ timeout: 9000 });
});

test("use-reduced-motion follows the setting live; use-format and locale follow the provider", async ({ page }) => {
  await page.goto("/docs/use-reduced-motion");
  const status = page.getByRole("main").getByRole("status").first();
  await expect(status).toContainText("off");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(status).toContainText("on, so nothing moves");

  await page.goto("/docs/use-format");
  let main = page.getByRole("main");
  await expect(main.getByTestId("amount")).toHaveText(/R\$\s1\.260,50/);
  await main.getByRole("button", { name: "en", exact: true }).click();
  await expect(main.getByTestId("amount")).toHaveText("R$1,260.50");
  await expect(main.getByTestId("due")).toHaveText("Oct 18, 2026");

  await page.goto("/docs/locale");
  main = page.getByRole("main");
  await expect(main.getByRole("button", { name: "Copiar" })).toBeVisible();
  await main.getByRole("button", { name: "es", exact: true }).click();
  await expect(main.getByRole("button", { name: "Mostrar opciones" })).toBeVisible();
});

test("use-stick-to-bottom follows the end, stays put when reading back, and jumps", async ({ page }) => {
  await page.goto("/docs/use-stick-to-bottom");
  const main = page.getByRole("main");
  const log = main.getByRole("list", { name: "Agent events" });
  const atEnd = () => log.evaluate((el) => el.scrollHeight - el.scrollTop - el.clientHeight < 2);
  await main.getByRole("button", { name: "Add an event" }).click();
  await expect.poll(atEnd).toBe(true);
  await log.evaluate((el) => (el.scrollTop = 0));
  await expect(main.getByText("Reading back: new events do not move the log.")).toBeVisible();
  await main.getByRole("button", { name: "Add an event" }).click();
  expect(await log.evaluate((el) => el.scrollTop)).toBe(0);
  await main.getByRole("button", { name: "Jump to latest" }).click();
  await expect.poll(atEnd).toBe(true);
});

test("share-metadata writes the tags, and refuses an image from another origin", async ({ page }) => {
  await page.goto("/docs/share-metadata");
  const main = page.getByRole("main");
  const tags = main.getByRole("definition");
  await main.getByRole("textbox", { name: "Title" }).fill("Bakery website");
  await expect(tags.first()).toContainText("Bakery website");
  await main.getByRole("textbox", { name: "Image URL" }).fill("https://tracker.example/pixel.png");
  await expect(main.getByRole("definition").first()).toContainText("image.url");
  await expect(main.getByRole("term").first()).toHaveText("refused");
});

test("attachment and reasoning: a file is checked before upload, and the reasoning opens redacted", async ({ page }) => {
  await page.goto("/docs/attachment");
  const main = page.getByRole("main");
  await main.getByLabel("Files (PNG, JPEG or PDF, up to 2 MB)").setInputFiles([
    { name: "brief.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.7") },
    { name: "run.exe", mimeType: "application/x-msdownload", buffer: Buffer.from("MZ") },
  ]);
  await expect(main.getByRole("list", { name: "Checked files" }).getByRole("listitem")).toHaveText(["brief.pdf: ready to upload", "run.exe: refused: this type of file is not allowed"]);

  await page.goto("/docs/reasoning");
  const reasoning = page.getByRole("main").getByRole("button", { name: "Thought for 4 s" });
  await reasoning.press("Enter");
  await expect(reasoning).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("main").getByText("412 rows is enough for a summary.")).toBeVisible();
  await expect(page.getByRole("main").getByText("sk-live-41f9")).toHaveCount(0);
});

test("the library demos fit 390 px in dark", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.setViewportSize({ width: 390, height: 844 });
  for (const name of ["api", "untrusted", "redact", "secure-action", "bff-stream", "event-stream", "use-event-stream", "use-idle-timeout", "use-format", "locale", "use-stick-to-bottom", "share-metadata", "attachment", "reasoning", "use-reduced-motion"]) {
    await page.goto(`/docs/${name}`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth), name).toBeLessThanOrEqual(390);
  }
});
