import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { expect, test, type Page } from "@playwright/test";

/**
 * Layout checks by geometry (#118). A screenshot baseline only proves that nothing changed since it was taken, so a
 * baseline captured from broken code stays green. These assert how things must sit, whatever the baseline says:
 * indicators centred in their controls, icons level with their text, focus rings not clipped, no sideways scroll at
 * 320 px. Every built page runs (each component and block page included), in the light, dark and brand themes.
 */

const out = fileURLToPath(new URL("../out/", import.meta.url));
const html = (dir: string) => readdirSync(`${out}${dir}`).filter((f) => f.endsWith(".html")).map((f) => `/${dir}${f.slice(0, -5)}`);
// Block pages show the block in a frame, so the bare block pages (blocks/view) run too.
const pages = ["/", ...html("").filter((p) => !["/index", "/404", "/_not-found"].includes(p)), ...html("docs/"), ...html("blocks/"), ...html("blocks/view/"), ...html("demo/remote/")];
const themes = ["light", "dark", "brand"] as const;

/** Half a CSS pixel: anything visible to the eye is at least one device pixel off on a 2x screen. */
const CENTRED = 0.5;

type Box = { x: number; y: number; width: number; height: number };
const centre = (b: Box) => ({ x: b.x + b.width / 2, y: b.y + b.height / 2 });

async function settle(page: Page, theme: (typeof themes)[number]) {
  await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
  await page.evaluate(() => document.fonts.ready);
}

/** Every [data-slot=root] on the page with the box of its [data-slot=inner]. */
async function pairs(page: Page, root: string, inner: string) {
  return page.evaluate(([r, i]) => {
    const box = (e: Element) => { const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, width: b.width, height: b.height }; };
    return [...document.querySelectorAll(`[data-slot=${r}]`)]
      .map((el) => ({ outer: box(el), inner: el.querySelector(`[data-slot=${i}]`), border: parseFloat(getComputedStyle(el).borderTopWidth) }))
      .filter((p) => p.inner && p.outer.width > 0)
      .map((p) => ({ outer: p.outer, inner: box(p.inner!), border: p.border }));
  }, [root, inner] as const);
}

for (const path of pages) {
  test(`${path} lays out by the rules`, async ({ page }) => {
    await page.goto(path, { waitUntil: "networkidle" });

    for (const theme of themes) {
      await settle(page, theme);
      const where = `${path} (${theme})`;

      // Radio and checkbox: the dot or tick sits in the exact centre. Unchecked checkboxes have no indicator, so tick them.
      await page.evaluate(() => document.querySelectorAll<HTMLElement>("[data-slot=checkbox][data-unchecked]:not([data-disabled])").forEach((b) => b.click()));
      for (const [root, inner] of [["radio-group-item", "radio-group-indicator"], ["checkbox", "checkbox-indicator"]] as const) {
        for (const p of await pairs(page, root, inner)) {
          if (!p.inner.width) continue;
          const [o, i] = [centre(p.outer), centre(p.inner)];
          expect(Math.abs(i.x - o.x), `${root} indicator off-centre horizontally on ${where}`).toBeLessThan(CENTRED);
          expect(Math.abs(i.y - o.y), `${root} indicator off-centre vertically on ${where}`).toBeLessThan(CENTRED);
        }
      }

      // Switch: the thumb is centred vertically and keeps the same gap to the track on every side it rests against.
      for (const p of await pairs(page, "switch", "switch-thumb")) {
        const top = p.inner.y - p.outer.y;
        const bottom = p.outer.y + p.outer.height - (p.inner.y + p.inner.height);
        const side = Math.min(p.inner.x - p.outer.x, p.outer.x + p.outer.width - (p.inner.x + p.inner.width));
        expect(Math.abs(top - bottom), `switch thumb off-centre vertically on ${where}`).toBeLessThan(CENTRED);
        expect(Math.abs(side - top), `switch thumb closer to one side than to the top on ${where}`).toBeLessThan(CENTRED);
      }

      // An icon next to one line of text in a flex row (buttons, badges, menu items, links, triggers): centres agree.
      const misaligned = await page.evaluate(() => {
        const bad: string[] = [];
        for (const icon of document.querySelectorAll("svg")) {
          const row = icon.parentElement;
          if (!row || !/flex/.test(getComputedStyle(row).display) || getComputedStyle(row).flexDirection !== "row") continue;
          const a = icon.getBoundingClientRect();
          const text = [...row.childNodes].find((n) => n !== icon && n.textContent?.trim() && !(n instanceof SVGElement));
          if (!a.width || !text) continue;
          // A flex item's own box is its line box; a bare text node only has the box of its glyphs.
          const range = document.createRange();
          range.selectNodeContents(text);
          const t = text instanceof Element ? text.getBoundingClientRect() : range.getBoundingClientRect();
          const line = parseFloat(getComputedStyle(text instanceof Element ? text : row).lineHeight) || t.height;
          if (t.width <= 1 || t.height <= 1) continue; // visually hidden text (sr-only) has nothing to line up with
          if (t.height > line * 1.5) continue; // wrapped text has no single line to align to
          const off = a.y + a.height / 2 - (t.y + t.height / 2);
          if (Math.abs(off) > 1) bad.push(`"${text.textContent!.trim().slice(0, 30)}" icon ${off.toFixed(1)}px off in ${row.getAttribute("data-slot") ?? row.tagName.toLowerCase()}`);
        }
        // An icon placed over an input (search fields) is centred on the field.
        for (const input of document.querySelectorAll("[data-slot=input]")) {
          const icon = input.parentElement?.querySelector(":scope > svg");
          if (!icon) continue;
          const [a, b] = [icon.getBoundingClientRect(), input.getBoundingClientRect()];
          const off = a.y + a.height / 2 - (b.y + b.height / 2);
          if (a.width && Math.abs(off) > 1) bad.push(`input icon ${off.toFixed(1)}px off`);
        }
        return bad;
      });
      expect(misaligned, `icons out of line with their text on ${where}`).toEqual([]);
    }

    // Focus rings are drawn outside the control; no ancestor that clips may cut them. Theme does not move anything, so once.
    await page.keyboard.press("Shift"); // keyboard modality: programmatic focus then shows :focus-visible
    const clipped = await page.evaluate(() => {
      const bad: string[] = [];
      const extent = (shadow: string) =>
        Math.max(0, ...shadow.split(/,(?![^(]*\))/).filter((s) => s.trim() !== "none" && !s.includes("inset")).map((s) => {
          const n = (s.replace(/rgba?\([^)]*\)|oklch\([^)]*\)|#\w+/g, "").match(/-?[\d.]+px/g) ?? []).map(parseFloat);
          return (n[2] ?? 0) + (n[3] ?? 0) + Math.max(Math.abs(n[0] ?? 0), Math.abs(n[1] ?? 0));
        }));
      const focusable = document.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])");
      for (const el of focusable) {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height || getComputedStyle(el).visibility === "hidden") continue;
        el.focus({ preventScroll: true });
        if (!el.matches(":focus-visible")) continue;
        const style = getComputedStyle(el);
        const outline = style.outlineStyle === "none" ? 0 : parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset);
        const ring = Math.max(outline, extent(style.boxShadow));
        el.blur();
        if (ring <= 0) continue;
        for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
          const s = getComputedStyle(a);
          if (s.overflowX === "visible" && s.overflowY === "visible") continue;
          const b = a.getBoundingClientRect();
          const box = { left: b.left + a.clientLeft, top: b.top + a.clientTop, right: b.left + a.clientLeft + a.clientWidth, bottom: b.top + a.clientTop + a.clientHeight };
          // Only controls fully in view inside the clipping box: one scrolled out of view is not a clipped ring.
          if (r.left < box.left || r.top < box.top || r.right > box.right || r.bottom > box.bottom) break;
          const x = s.overflowX !== "visible" && (r.left - ring < box.left - 0.5 || r.right + ring > box.right + 0.5);
          const y = s.overflowY !== "visible" && (r.top - ring < box.top - 0.5 || r.bottom + ring > box.bottom + 0.5);
          if (x || y) {
            const name = el.getAttribute("aria-label") ?? el.textContent?.trim().slice(0, 30) ?? el.tagName;
            bad.push(`${el.tagName.toLowerCase()} "${name}" ring cut by ${a.tagName.toLowerCase()}.${[...a.classList].slice(0, 3).join(".")}`);
            break;
          }
        }
      }
      return bad;
    });
    expect(clipped, `focus rings clipped on ${path}`).toEqual([]);

    // No sideways scroll on the smallest phone width.
    await page.setViewportSize({ width: 320, height: 800 });
    for (const theme of themes) {
      await settle(page, theme);
      const overflow = await page.evaluate(() => {
        const width = document.documentElement.clientWidth;
        if (document.documentElement.scrollWidth <= width) return [];
        return [...document.querySelectorAll("body *")]
          .filter((e) => {
            if (e.getBoundingClientRect().right <= width + 0.5) return false;
            let p = e.parentElement;
            while (p && p !== document.body && getComputedStyle(p).overflowX === "visible") p = p.parentElement;
            return !p || p === document.body; // inside a scroll or clip box it does not move the page
          })
          .slice(0, 5)
          .map((e) => `${e.tagName.toLowerCase()}.${[...e.classList].slice(0, 4).join(".")} ends at ${Math.round(e.getBoundingClientRect().right)}px`);
      });
      expect(overflow, `horizontal overflow at 320 px on ${path} (${theme})`).toEqual([]);
    }
  });
}
