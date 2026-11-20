import type { Page } from "@playwright/test";
import { readdirSync } from "node:fs";
import { join } from "node:path";

import { colors } from "../registry/aedis/lib/tokens";
import { expect, test } from "./fixtures";
import { probeReport, probeTheme, tokensIn } from "./probe-theme";

// #288: the screenshot projects catch a pixel that moves, not a colour token that reaches no element. The probe theme
// gives every token its own colour; across the theming showcase and every component and block page, each token must
// be the computed colour of at least one element. A token wired to nothing would let a person change it in the theme
// editor, /create or `aedis theme import` and see nothing happen. Assertions on computed styles, no screenshot.

/** Tokens no element paints on purpose, each with its reason. Nothing is exempt silently; a stale entry fails. */
const EXEMPT: Record<string, string> = {
  "chart-4": "Chart offers five series colours; the chart demos use up to three.",
  "chart-5": "Chart offers five series colours; the chart demos use up to three.",
  "material-thin": "Offered to apps for chips and floating controls; no component of the registry uses the material-thin utility yet.",
};

const names = Object.keys(colors);
const theme = probeTheme(names);

const out = join(process.cwd(), "out");
const htmlIn = (dir: string) => readdirSync(join(out, dir)).filter((f) => f.endsWith(".html")).map((f) => `/${dir}/${f.slice(0, -5)}`);
/** The theming showcase, then every page of a component, hook or library, and every block on its own. */
const pages = ["/themes", ...htmlIn("docs"), ...htmlIn("blocks/view")];

const PROPERTIES = ["color", "background-color", "background-image", "border-top-color", "border-right-color", "border-bottom-color", "border-left-color", "outline-color", "box-shadow", "text-decoration-color", "fill", "stroke"];

/** Applies the probe theme on <html> (inline, through the CSSOM, so the CSP allows it) and returns every colour the page computes, with the strings each token computes to. */
async function probe(page: Page) {
  return page.evaluate(({ theme, properties }) => {
    // Without this, an element with a transition (every Button) still computes the old colour when it is read.
    const still = new CSSStyleSheet();
    still.replaceSync("*, *::before, *::after { transition: none !important; animation: none !important; }");
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, still];
    for (const [n, v] of Object.entries(theme)) document.documentElement.style.setProperty(`--${n}`, v);
    const ref = document.body.appendChild(document.createElement("i"));
    const read = (value: string) => {
      ref.style.color = value;
      return getComputedStyle(ref).color;
    };
    const keys = Object.fromEntries(
      Object.keys(theme).map((n) => {
        // A Tailwind opacity modifier mixes with transparent in oklab: L a b stay the token's, only the alpha changes.
        const mixed = read(`color-mix(in oklab, var(--${n}) 50%, transparent)`);
        return [n, [read(`var(--${n})`), mixed.slice(0, mixed.indexOf("/") + 1)]];
      }),
    );
    ref.remove();
    const values = new Set<string>();
    for (const el of document.querySelectorAll("*")) {
      if (!el.checkVisibility({ visibilityProperty: true })) continue;
      for (const pseudo of [null, "::before", "::after"]) {
        const style = getComputedStyle(el, pseudo);
        if (pseudo && style.content === "none") continue;
        for (const p of properties) values.add(style.getPropertyValue(p));
      }
    }
    return { keys, values: [...values] };
  }, { theme, properties: PROPERTIES });
}

test("every colour token paints at least one element under the probe theme", async ({ page }) => {
  test.setTimeout(15 * 60_000);
  const found = new Set<string>();
  const where = new Map<string, string>();
  const collect = async (label: string) => {
    const { keys, values } = await probe(page);
    for (const n of tokensIn(values, keys)) {
      if (!found.has(n)) where.set(n, label);
      found.add(n);
    }
  };
  for (const path of pages) {
    await page.goto(path, { waitUntil: "networkidle" });
    // Focus shows the ring: the first Tab lands on the skip link, which wears focus-ring.
    await page.keyboard.press("Tab");
    await collect(path);
  }
  // The scrim and the raised surface only paint while a modal is open.
  await page.goto("/docs/alert-dialog", { waitUntil: "networkidle" });
  await page.getByRole("main").getByRole("button", { name: "Approve and send" }).first().click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await collect("/docs/alert-dialog (open)");

  const { unused, staleExemptions } = probeReport(names, found, EXEMPT);
  test.info().annotations.push({ type: "first seen", description: [...where].map(([n, p]) => `${n}: ${p}`).join("\n") });
  expect(unused, "colour tokens no element paints: wire them up, or add them to EXEMPT with a reason").toEqual([]);
  expect(staleExemptions, "exempt tokens that are painted now, or no longer exist: remove them from EXEMPT").toEqual([]);
});
