import fc from "fast-check";

import { contrast, parseColor, parseOklch } from "@/registry/aedis/lib/contrast";
import {
  applyTheme,
  MAX_THEME_BYTES,
  normalizeColor,
  parseThemeJson,
  themeToCss,
  themeVariableNames,
  themeVariables,
  typeVariables,
  validateTheme,
  type CustomTheme,
} from "@/registry/aedis/lib/custom-theme";
import { colors, contrastPairs } from "@/registry/aedis/lib/tokens";

const base = { version: 1, name: "Acme", colors: { light: {}, dark: {} } };
const acme = { ...base, colors: { light: { primary: "#0b6e4f" }, dark: { primary: "oklch(0.55 0.12 160)" } }, radius: { sm: 4, md: 8 }, blur: { regular: 10 }, shadow: 0.5, font: "rounded" };
const FORBIDDEN = /url\(|@|\}|;|expression\(/i;

const errors = (input: unknown) => {
  const r = validateTheme(input);
  return r.ok ? [] : r.errors;
};

describe("validateTheme", () => {
  it("accepts a typed theme and normalizes it", () => {
    const r = validateTheme({ ...acme, name: " Acme\u200B " });
    expect(r).toMatchObject({ ok: true, theme: { name: "Acme", colors: { light: { primary: "#0b6e4f" }, dark: { primary: "oklch(0.55 0.12 160)" } }, shadow: 0.5 } });
  });

  it("refuses CSS smuggled into a color", () => {
    for (const value of ["red", "#fff; background: url(https://x)", "url(https://evil/x)", "oklch(0.5 0.1 10) } body { display: none", "var(--x)", "expression(alert(1))", "@import 'x'"]) {
      expect(errors({ ...base, colors: { light: { primary: value }, dark: {} } })).toContain("colors.light.primary must be a hex color or oklch()");
    }
  });

  it("refuses unknown keys, unknown tokens, out-of-range numbers and fonts outside the allow-list", () => {
    expect(errors({ ...base, css: "body{}" })).toContain("css is not part of the theme schema");
    expect(errors({ ...base, colors: { light: { display: "#000" }, dark: {} } })).toContain("colors.light.display is not a theme color");
    expect(errors({ ...base, colors: { light: {}, dark: {}, sepia: {} } })).toContain("colors.sepia is not part of the theme schema");
    expect(errors({ ...base, radius: { sm: 99 } })).toContain("radius.sm must be a number from 0 to 32");
    expect(errors({ ...base, radius: { huge: 1 } })).toContain("radius.huge is not part of the theme schema");
    expect(errors({ ...base, blur: { thin: "12px" } })).toContain("blur.thin must be a number from 0 to 40");
    expect(errors({ ...base, blur: [] })).toContain("blur must be an object");
    expect(errors({ ...base, shadow: Number.NaN })).toContain("shadow must be a number from 0 to 2");
    expect(errors({ ...base, font: "https://fonts.example/tracker.woff2" })).toContain("font must be one of system, rounded, serif, mono");
    expect(errors({ ...base, version: 2, name: "" })).toEqual(["version must be 1", "name must be 1–64 characters"]);
    expect(errors({ ...base, colors: { light: [], dark: {} } })).toContain("colors.light must be an object");
    expect(errors({ ...base, colors: "x" })).toContain("colors must be an object with light and dark");
    expect(errors("theme")).toEqual(["theme must be an object"]);
  });

  it("declares sans, display and mono fonts as presets or self-hosted families (#202)", () => {
    const result = validateTheme({ ...base, fonts: { sans: "Brand Sans", display: "serif", mono: "JetBrains Mono" } });
    expect(result.ok).toBe(true);
    const vars = themeVariables((result as { theme: CustomTheme }).theme, "light");
    expect(vars["--font-sans"]).toMatch(/^"Brand Sans", -apple-system/);
    expect(vars["--font-display"]).toMatch(/^ui-serif/);
    expect(vars["--font-mono"]).toMatch(/^"JetBrains Mono", ui-monospace/);
    expect(themeToCss({ ...base, fonts: { display: "Fraunces" } })).toContain('--font-display: "Fraunces", -apple-system');
    expect(errors({ ...base, fonts: { body: "Inter" } })).toContain("fonts.body is not part of the theme schema");
    expect(errors({ ...base, fonts: { display: "url(https://fonts.example/x.woff2)" } })[0]).toMatch(/^fonts\.display must be one of/);
    expect(errors({ ...base, fonts: "Inter" })).toContain("fonts must be an object with sans, display or mono");
  });

  it("never lets a font name close the quotes, the rule or reach a url (property, #202)", () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 60 }), (name) => {
        const result = validateTheme({ ...base, fonts: { display: name } });
        if (!result.ok) return;
        const stack = themeVariables(result.theme, "light")["--font-display"];
        expect(stack.split(",")[0]).toMatch(/^("[A-Za-z][A-Za-z0-9 -]*"|ui-\w+|-apple-system)/);
        expect(stack).not.toMatch(/[;{}\\]|url\(|@import/i);
      }),
    );
  });

  it("takes type settings only within the bounds that keep text readable", () => {
    expect(validateTheme({ ...base, type: { base: 15, scale: 0.9, leading: 1.6 } })).toMatchObject({ ok: true, theme: { type: { base: 15, scale: 0.9, leading: 1.6 } } });
    expect(errors({ ...base, type: { base: 11 } })).toContain("type.base must be a number from 14 to 18");
    expect(errors({ ...base, type: { leading: "2; color: red" } })).toContain("type.leading must be a number from 1.3 to 1.7");
    expect(errors({ ...base, type: { tracking: 1 } })).toContain("type.tracking is not part of the theme schema");
    expect(errors({ ...base, type: [] })).toContain("type must be an object");
  });

  it("derives every size from the type settings, never under 12 px (property)", () => {
    fc.assert(
      fc.property(fc.double({ min: 14, max: 18, noNaN: true }), fc.double({ min: 0.8, max: 1.2, noNaN: true }), (b, k) => {
        const vars = typeVariables({ base: b, scale: k });
        for (const v of Object.values(vars)) expect(parseFloat(v) * 16).toBeGreaterThanOrEqual(12 - 1e-6);
        expect(parseFloat(vars["--text-body"]) * 16).toBeCloseTo(b, 2);
        expect(parseFloat(vars["--text-display"])).toBeGreaterThan(parseFloat(vars["--text-title-1"]));
      }),
    );
    expect(typeVariables({})["--text-display"]).toBe("3rem");
    expect(typeVariables({ leading: 1.6 })["--text-body--line-height"]).toBe("1.6");
  });

  it("scales every motion duration, and 0 turns motion off", () => {
    const off = validateTheme({ ...base, motion: 0 });
    expect(off.ok && themeVariables(off.theme, "light")["--duration-spring"]).toBe("0ms");
    const slow = validateTheme({ ...base, motion: 1.25 });
    expect(slow.ok && themeVariables(slow.theme, "light")["--duration-fast"]).toBe("250ms");
    expect(errors({ ...base, motion: 3 })).toContain("motion must be a number from 0 to 1.5");
  });

  it("refuses a theme that fails contrast AA, in light or dark", () => {
    expect(errors({ ...base, colors: { light: { foreground: "#f6f7f9" }, dark: {} } })).toContain("light: foreground on background is 1.00:1, needs 4.5:1");
    expect(errors({ ...base, colors: { light: {}, dark: { "muted-foreground": "#3a3f48" } } }).some((e) => e.startsWith("dark: muted-foreground on"))).toBe(true);
  });

  it("refuses a destructive action that looks like the primary one", () => {
    expect(errors({ ...base, colors: { light: { "destructive-solid": "#2457d6" }, dark: {} } })).toContain("light: destructive-solid is too close to primary");
  });

  it("never returns a value that could escape a declaration, and every accepted theme passes contrast (property)", () => {
    const color = fc.oneof(
      fc.string(),
      fc.stringMatching(/^#[0-9a-fA-F]{6}$/),
      fc.tuple(fc.double({ min: 0, max: 1.2, noNaN: true }), fc.double({ min: 0, max: 0.6, noNaN: true }), fc.double({ min: 0, max: 400, noNaN: true })).map(([l, c, h]) => `oklch(${l} ${c} ${h})`),
    );
    const tokens = fc.dictionary(fc.constantFrom(...(Object.keys(colors) as string[]), "x", "__proto__"), color, { maxKeys: 6 });
    const theme = fc.record({
      version: fc.constantFrom(1, 2),
      name: fc.string(),
      colors: fc.record({ light: tokens, dark: tokens }),
      radius: fc.option(fc.dictionary(fc.constantFrom("xs", "sm", "md", "lg", "xl", "zz"), fc.oneof(fc.double(), fc.string())), { nil: undefined }),
      shadow: fc.option(fc.oneof(fc.double(), fc.string()), { nil: undefined }),
      font: fc.option(fc.oneof(fc.constantFrom("system", "rounded", "serif"), fc.string()), { nil: undefined }),
    });
    fc.assert(
      fc.property(theme, (input) => {
        const r = validateTheme(input);
        if (!r.ok) return;
        for (const mode of ["light", "dark"] as const) {
          const vars = themeVariables(r.theme, mode);
          for (const [k, v] of Object.entries(vars)) {
            expect(themeVariableNames.has(k)).toBe(true);
            expect(v).not.toMatch(FORBIDDEN);
          }
          for (const [fg, bg, min] of contrastPairs) expect(contrast(vars[`--${fg}`], vars[`--${bg}`], vars["--background"])).toBeGreaterThanOrEqual(min);
        }
        expect(themeToCss(r.theme).replace(/[{};]/g, "")).not.toMatch(/url\(|@import|expression\(/i);
      }),
      { numRuns: 300 },
    );
  });

  it("normalizes any accepted color to a canonical hex or oklch() (property)", () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        const c = normalizeColor(s);
        if (c !== null) expect(c).toMatch(/^(#[0-9a-f]{6}([0-9a-f]{2})?|oklch\([\d. /]+\))$/);
      }),
    );
    expect(normalizeColor("#ABC")).toBe("#aabbcc");
    expect(normalizeColor("oklch(55% 0.1 20deg / 50%)")).toBe("oklch(0.55 0.1 20 / 0.5)");
    expect(normalizeColor(42)).toBeNull();
  });
});

describe("parseThemeJson", () => {
  it("treats a stored theme as untrusted: size limit, JSON and full validation", () => {
    expect(parseThemeJson("x".repeat(MAX_THEME_BYTES + 1))).toEqual({ ok: false, errors: [`theme is larger than ${MAX_THEME_BYTES} bytes`] });
    expect(parseThemeJson("{")).toEqual({ ok: false, errors: ["theme is not valid JSON"] });
    expect(parseThemeJson(JSON.stringify(acme)).ok).toBe(true);
    expect(parseThemeJson('{"__proto__": {"polluted": true}, "version": 1}').ok).toBe(false);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
});

describe("applyTheme", () => {
  it("sets only schema variables, one by one through the CSSOM, and cleans up", () => {
    const target = document.createElement("div");
    const set = vi.spyOn(target.style, "setProperty");
    const undo = applyTheme(acme, { mode: "dark", target });
    expect(set.mock.calls.every(([k]) => themeVariableNames.has(k))).toBe(true);
    expect(target.style.getPropertyValue("--primary")).toBe("oklch(0.55 0.12 160)");
    expect(target.style.getPropertyValue("--background")).toBe(colors.background.dark);
    expect(target.style.getPropertyValue("--radius-sm")).toBe("4px");
    expect(target.style.getPropertyValue("--blur-regular")).toBe("10px");
    expect(target.style.getPropertyValue("--elevation-1")).toBe("0 1px 2px rgba(0,0,0,0.2)");
    expect(target.style.getPropertyValue("--font-sans")).toContain("ui-rounded");
    undo();
    expect(target.getAttribute("style") ?? "").toBe("");
  });

  it("validates again and refuses an invalid theme", () => {
    expect(() => applyTheme({ ...base, colors: { light: { primary: "url(x)" }, dark: {} } } as unknown as CustomTheme, { mode: "light" })).toThrow(/Invalid theme/);
    expect(() => themeToCss({})).toThrow(/Invalid theme/);
  });

  it("defaults to the document root", () => {
    const undo = applyTheme(base, { mode: "light" });
    expect(document.documentElement.style.getPropertyValue("--primary")).toBe(colors.primary.light);
    undo();
  });
});

describe("themeToCss", () => {
  it("emits light, system dark and data-theme dark from validated values", () => {
    const css = themeToCss(acme);
    expect(css).toContain(":root { --background: #f6f7f9;");
    expect(css).toContain('@media (prefers-color-scheme: dark) { :root:not([data-theme]) { --background: #0d1015;');
    expect(css).toContain(':root[data-theme="dark"]');
  });
});

describe("color parsing", () => {
  it("reads hex8 and oklch, and refuses out-of-range oklch", () => {
    expect(parseColor("#ff000080")).toEqual([255, 0, 0, 128 / 255]);
    expect(parseColor("oklch(1 0 0)")).toEqual([255, 255, 255, 1]);
    expect(parseColor("oklch(0 0 0)")).toEqual([0, 0, 0, 1]);
    expect(parseOklch("oklch(1.5 0 0)")).toBeNull();
    expect(parseOklch("oklch(0.5 0.1 10 / 2)")).toBeNull();
    expect(parseOklch("oklch(50% 0.1 10 / 40%)")).toEqual({ l: 0.5, c: 0.1, h: 10, alpha: 0.4 });
  });
});
