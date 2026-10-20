import { readdirSync, readFileSync } from "node:fs";

import { contrast } from "@/registry/aedis/lib/contrast";
import { themeCss } from "@/registry/aedis/lib/theme-css";
import { colors, contrastPairs, themeNames } from "@/registry/aedis/lib/tokens";

describe("default theme", () => {
  it("stylesheet is generated from the tokens (run `pnpm theme` after changing them)", async () => {
    await expect(themeCss()).toMatchFileSnapshot("../registry/aedis/styles/theme.css");
  });

  it.each(themeNames)("%s passes AA contrast on every text and control pair", (theme) => {
    const failing = contrastPairs
      .map(([fg, bg, min]) => ({ pair: `${fg} on ${bg}`, ratio: contrast(colors[fg][theme], colors[bg][theme], colors.background[theme]), min }))
      .filter((p) => p.ratio < p.min);
    expect(failing).toEqual([]);
  });

  it("destructive never looks like primary", () => {
    for (const theme of themeNames) expect(colors["destructive-solid"][theme]).not.toBe(colors.primary[theme]);
  });

  it("the site loads the generated theme and no keyframe library", () => {
    const globals = readFileSync(`${process.cwd()}/app/globals.css`, "utf8");
    expect(globals).toContain('@import "../registry/aedis/styles/theme.css"');
    expect(globals).not.toContain("tw-animate-css");
  });
});

describe("components", () => {
  const dir = `${process.cwd()}/registry/aedis/ui`;
  const files = readdirSync(dir).map((f) => [f, readFileSync(`${dir}/${f}`, "utf8")] as const);
  // Colors, radii, shadows and durations come from tokens; these are the ways to bypass them.
  const bypass = [
    /#[0-9a-f]{3,8}\b/i,
    /\b(rgba?|hsla?|oklch)\(/,
    /\b(bg|text|border|ring|fill|stroke)-(black|white|(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d+)\b/,
    /\brounded-(\[|2xl|3xl|4xl)/,
    /\bshadow-(2xs|xs|sm|md|lg|xl|2xl|\[)/,
    /\bduration-(\d|\[)/,
    /\bease-(in|linear|in-out|\[)\b/,
  ];

  it.each(files)("%s takes every color, radius, shadow and duration from the theme", (_name, source) => {
    expect(bypass.filter((re) => re.test(source)).map(String)).toEqual([]);
  });
});

describe("motion", () => {
  const css = themeCss();
  const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));

  it("reduced motion turns scale, blur and springs into a short cross-fade", () => {
    for (const rule of ["--press-scale: 1;", "--materialize-scale: 1;", "--blur-materialize: 0px;", "--ease-spring-bouncy: ease;", "--duration-spring: var(--duration-fast);"]) {
      expect(reduced).toContain(rule);
    }
  });

  it("utilities animate only compositor-friendly properties and colors", () => {
    const animated = [...css.matchAll(/([a-z-]+) var\(--duration/g)].map((m) => m[1]);
    expect(new Set(animated)).toEqual(new Set(["scale", "translate", "transform", "color", "background-color", "border-color", "box-shadow", "opacity", "filter", "clip-path"]));
  });

  it("reduced transparency makes every material solid", () => {
    const block = css.slice(css.indexOf("@media (prefers-reduced-transparency: reduce)"), css.indexOf("@media (prefers-contrast: more)"));
    for (const m of ["thin", "regular", "thick"]) {
      expect(block).toContain(`--material-${m}: var(--surface);`);
      expect(block).toContain(`--blur-${m}: 0px;`);
    }
  });

  it("data-reduced-transparency forces exactly the same as the media query", () => {
    const vars = (from: string) => {
      const start = css.indexOf(from);
      return css.slice(start, css.indexOf("}", start)).split(/\r?\n/).map((l) => l.trim()).filter((l) => l.startsWith("--"));
    };
    const media = vars("@media (prefers-reduced-transparency: reduce)");
    expect(media).toHaveLength(7);
    expect(vars(":root[data-reduced-transparency]")).toEqual(media);
  });
});

describe("contrast", () => {
  it("matches the WCAG reference values", () => {
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 1);
    expect(contrast("#777777", "#ffffff")).toBeCloseTo(4.48, 2);
    expect(contrast("#fff", "#fff")).toBe(1);
  });

  it("composites translucent colors over the page background", () => {
    expect(contrast("#000000", "rgba(255,255,255,0)", "#000000")).toBeCloseTo(1, 5);
    expect(contrast("rgba(0,0,0,0.5)", "#ffffff")).toBeCloseTo(contrast("#808080", "#ffffff"), 1);
  });

  it("rejects colors it cannot read", () => {
    expect(() => contrast("red", "#fff")).toThrow();
  });
});
