import fc from "fast-check";

import { hasInvisible, INVISIBLE, stripInvisible } from "@/lib/untrusted";
import { safeUrl } from "@/registry/aedis/ui/markdown";

describe("stripInvisible", () => {
  it("removes Unicode tags, zero-width text and bidi overrides", () => {
    const tags = "Pay\u{E0049}\u{E0047}\u{E004E}\u{E004F}\u{E0052}\u{E0045} the invoice";
    expect(stripInvisible(tags)).toBe("Pay the invoice");
    expect(stripInvisible("a\u200Bb\u2060c\uFEFFd")).toBe("abcd");
    expect(stripInvisible("\u202Egnp.exe\u202C")).toBe("gnp.exe");
    expect(hasInvisible(tags)).toBe(true);
    expect(hasInvisible("plain")).toBe(false);
  });

  it("keeps joiners and direction marks that emoji and right-to-left scripts need", () => {
    const family = "👨\u200D👩\u200D👧";
    const persian = "می\u200Cخواهم";
    const marks = "\u200Eabc\u200F";
    for (const text of [family, persian, marks]) expect(stripInvisible(text)).toBe(text);
  });

  it("is idempotent and never leaves an invisible code point (property)", () => {
    fc.assert(
      fc.property(fc.string({ unit: "grapheme-composite" }), (text) => {
        const once = stripInvisible(text);
        expect(hasInvisible(once)).toBe(false);
        expect(stripInvisible(once)).toBe(once);
        expect(once.length).toBeLessThanOrEqual(text.length);
      }),
    );
  });

  it("only removes code points in the documented set (property)", () => {
    fc.assert(
      fc.property(fc.string({ unit: "grapheme-composite" }), (text) => {
        const kept = [...stripInvisible(text)];
        const removed = [...text].filter((c) => !c.match(INVISIBLE));
        expect(kept).toEqual(removed);
      }),
    );
  });
});

describe("safeUrl", () => {
  it("never returns a URL with a protocol outside the allow list (property)", () => {
    fc.assert(
      fc.property(fc.string({ unit: "grapheme" }), (input) => {
        const out = safeUrl(input);
        if (out === "") return;
        expect(["http:", "https:", "mailto:"]).toContain(new URL(out, "https://base.invalid").protocol);
      }),
    );
  });

  it("keeps relative references and refuses characters browsers drop while parsing", () => {
    for (const ok of ["?page=2", "docs/x", "./a", "../b", "#top", "//cdn.example.com/a"]) expect(safeUrl(ok)).toBe(ok);
    for (const bad of ["java\nscript:alert(1)", "java\tscript:alert(1)", "\u0001javascript:alert(1)", "ja\u200Bvascript:alert(1)", "foo:bar"]) expect(safeUrl(bad)).toBe("");
  });

  it("never lets a scheme through by case or whitespace tricks (property)", () => {
    const schemes = fc.constantFrom("javascript", "data", "vbscript", "file", "blob", "JaVaScRiPt");
    const pad = fc.string({ unit: fc.constantFrom(" ", "\t", "\n", "\u200B"), maxLength: 3 });
    fc.assert(
      fc.property(schemes, pad, fc.string(), (scheme, before, rest) => {
        expect(safeUrl(`${before}${scheme}:${rest}`)).toBe("");
      }),
    );
  });
});
