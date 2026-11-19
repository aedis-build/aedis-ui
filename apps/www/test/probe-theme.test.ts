import { colors, themeNames } from "@/registry/aedis/lib/tokens";
import { probeReport, probeTheme, tokensIn } from "@/visual/probe-theme";

// #288: the pure half of visual/theme-probe.behaviour.spec.ts.

const names = Object.keys(colors);
const theme = probeTheme(names);
const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

describe("probe theme", () => {
  it("gives every token an opaque colour, the same on every run", () => {
    expect(Object.keys(theme)).toEqual(names);
    for (const v of Object.values(theme)) expect(v).toMatch(/^#[0-9a-f]{6}$/);
    expect(probeTheme(names)).toEqual(theme);
  });

  it("keeps every probe colour apart from every other, so no two tokens can be confused after rounding", () => {
    const values = Object.values(theme).map(rgb);
    for (const [i, a] of values.entries())
      for (const b of values.slice(i + 1)) expect(Math.max(...a.map((v, k) => Math.abs(v - b[k]!)))).toBeGreaterThanOrEqual(4);
  });

  it("never reuses a colour of a real theme, which the terminal utility and the swatches paint literally", () => {
    const real = new Set(Object.values(colors).flatMap((c) => themeNames.map((t) => c[t].toLowerCase())));
    expect(Object.values(theme).filter((v) => real.has(v))).toEqual([]);
  });
});

describe("tokensIn", () => {
  const keys = { primary: ["rgb(1, 2, 3)", "oklab(0.1 0.2 0.3 /"], border: ["rgb(1, 2, 30)", ""] };

  it("finds a token by its colour anywhere in a computed value: alone, in a shadow, in a gradient", () => {
    expect(tokensIn(["rgb(1, 2, 3)"], keys)).toEqual(new Set(["primary"]));
    expect(tokensIn(["rgba(0, 0, 0, 0.1) 0px 1px 2px 0px, rgb(1, 2, 30) 0px 0px 0px 2px"], keys)).toEqual(new Set(["border"]));
    expect(tokensIn(["linear-gradient(rgb(9, 9, 9), rgb(1, 2, 3))"], keys)).toEqual(new Set(["primary"]));
  });

  it("finds a token under an opacity modifier by its oklab components", () => {
    expect(tokensIn(["oklab(0.1 0.2 0.3 / 0.1)"], keys)).toEqual(new Set(["primary"]));
    expect(tokensIn(["oklab(0.1 0.2 0.31 / 0.1)"], keys)).toEqual(new Set());
  });

  it("does not take a longer colour for a shorter one, nor an empty key for a match", () => {
    expect(tokensIn(["rgb(1, 2, 33)", "rgba(1, 2, 3, 0.5)", "transparent"], keys)).toEqual(new Set());
  });
});

describe("probeReport", () => {
  it("reports the tokens nothing painted, minus the exempt ones", () => {
    expect(probeReport(["a", "b", "c"], new Set(["a"]), { c: "on purpose" })).toEqual({ unused: ["b"], staleExemptions: [] });
  });

  it("reports an exemption once the token is painted, or once the token is gone", () => {
    expect(probeReport(["a", "b"], new Set(["a", "b"]), { a: "x", gone: "y" })).toEqual({ unused: [], staleExemptions: ["a", "gone"] });
  });
});
