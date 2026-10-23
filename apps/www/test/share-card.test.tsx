// @vitest-environment node
import { ImageResponse } from "next/og";
import { inflateSync } from "node:zlib";

import { cardPalette, cardText, fitChips, SHARE_CARD_LIMITS, ShareCard, shareCardFonts, type ShareCardProps } from "@/registry/aedis/ui/share-card";

/** Width, height and RGBA rows of an 8-bit RGBA, non-interlaced PNG (what next/og writes). */
function decode(png: Buffer) {
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  const chunks: Buffer[] = [];
  for (let at = 8; at < png.length; ) {
    const length = png.readUInt32BE(at);
    if (png.toString("ascii", at + 4, at + 8) === "IDAT") chunks.push(png.subarray(at + 8, at + 8 + length));
    at += 12 + length;
  }
  const raw = inflateSync(Buffer.concat(chunks));
  const bpp = 4;
  const stride = width * bpp;
  const pixels = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const v = raw[y * (stride + 1) + 1 + x];
      const a = x >= bpp ? pixels[y * stride + x - bpp] : 0;
      const b = y > 0 ? pixels[(y - 1) * stride + x] : 0;
      const c = x >= bpp && y > 0 ? pixels[(y - 1) * stride + x - bpp] : 0;
      const p = a + b - c;
      const paeth = Math.abs(p - a) <= Math.abs(p - b) && Math.abs(p - a) <= Math.abs(p - c) ? a : Math.abs(p - b) <= Math.abs(p - c) ? b : c;
      pixels[y * stride + x] = (v + [0, a, b, (a + b) >> 1, paeth][filter]) & 0xff;
    }
  }
  return { width, height, pixels };
}

const fonts = await shareCardFonts();
const fetches: string[] = [];

async function render(props: ShareCardProps) {
  const response = new ImageResponse(<ShareCard {...props} />, { width: 1200, height: 630, fonts });
  return Buffer.from(await response.arrayBuffer());
}

const logo = (
  <svg width="44" height="44" viewBox="0 0 64 64">
    <polygon points="8,8 56,8 47,58 17,58" fill="#c8a24c" />
  </svg>
);
const base: ShareCardProps = { brand: { name: "Aedis UI", logo }, domain: "ui.aedis.build", title: "" };
const art = (
  <svg width="430" height="300" viewBox="0 0 430 300">
    <rect x="1" y="1" width="428" height="298" rx="22" fill="#ffffff" />
  </svg>
);

beforeAll(() => {
  // next/og fetches a font or an emoji for any character its fonts lack: the card must never let it.
  // Its own wasm comes from data: URLs, which reach no host.
  const real = globalThis.fetch;
  vi.stubGlobal("fetch", (url: string | URL, init?: RequestInit) => {
    if (String(url).startsWith("data:")) return real(url, init);
    fetches.push(String(url));
    return Promise.reject(new Error("the share card fetched a URL"));
  });
});
afterAll(() => vi.unstubAllGlobals());
afterEach(() => expect(fetches).toEqual([]));

describe("share-card", () => {
  it.each(["light", "dark", "brand"] as const)("renders a 1200x630 PNG under 300 KB in %s", async (theme) => {
    const png = await render({ ...base, theme, eyebrow: "Micro-frontends", title: "One product, many teams, one CSP.", description: "Compose apps from frames, elements and zones without giving up the CSP.", chips: ["mf-frame", "mf-bridge", "Live demo"], art });
    const { width, height } = decode(png);
    expect([width, height]).toEqual([1200, 630]);
    expect(png.length).toBeLessThan(300 * 1024);
  }, 30_000);

  it("keeps worst-case text inside the card: long, unbreakable, non-Latin, emoji, hidden characters", async () => {
    const empty = decode(await render({ ...base, title: "", art }));
    const worst = decode(
      await render({
        ...base,
        art,
        eyebrow: "Ein sehr langer Abschnittsname, der nie endet und endet",
        title: `${"Supercalifragilisticexpialidocious".repeat(4)} — títulos com acentuação, 漢字, عربى and 🔥🚀 emoji ${"long ".repeat(40)}`,
        description: `${"W".repeat(400)} ${"descrição longa ".repeat(30)}‮hidden​`,
        chips: ["a chip far longer than any chip should ever be", "🔐 secure", "ñandú", "four", "five", "six"],
      }),
    );
    // The outer padding (64 px top and bottom, 72 px at the sides) and the art column stay exactly as without text.
    const outside = (x: number, y: number) => y < 60 || y >= 570 || x < 68 || x >= 1200 - 68 - 430;
    let changed = 0;
    for (let y = 0; y < 630; y++)
      for (let x = 0; x < 1200; x++) {
        if (!outside(x, y) || (y < 120 && x < 400) || (y >= 520 && x < 1200 - 68 - 430)) continue;
        const i = (y * 1200 + x) * 4;
        if (empty.pixels.compare(worst.pixels, i, i + 4, i, i + 4) !== 0) changed++;
      }
    expect(changed).toBe(0);
  }, 30_000);

  it("bounds and cleans text: ellipsis, no hidden or unsupported characters", () => {
    expect(cardText("Dropdown Menu", 72)).toBe("Dropdown Menu");
    expect(cardText("a".repeat(100), 10)).toBe(`${"a".repeat(9)}…`);
    expect(cardText("one two three four five six", 20)).toBe("one two three four…");
    expect(cardText("Ação ñ — “quoted” …", 72)).toBe("Ação ñ — “quoted” …");
    expect(cardText("emoji 🔥 漢字 ©‮​x", 72)).toBe("emoji x");
    expect(cardText(undefined, 10)).toBe("");
    expect(cardText({ toString: () => "<b>" } as unknown, 10)).toBe("");
    expect(Object.values(SHARE_CARD_LIMITS).every((n) => n > 0)).toBe(true);
  });

  it("keeps only the chips that fit beside the domain, in order", () => {
    expect(fitChips(["mf-frame", "mf-bridge", "Live demo"], "ui.aedis.build")).toEqual(["mf-frame", "mf-bridge", "Live demo"]);
    expect(fitChips(["a".repeat(24), "b".repeat(24), "c"], "ui.aedis.build")).toEqual(["a".repeat(24)]);
    expect(fitChips(["x".repeat(24), "y".repeat(24)], "")).toEqual(["x".repeat(24)]);
  });

  it("takes its colors from the theme tokens, and a custom theme only once validated", () => {
    expect(cardPalette("light").background).toBe("#f6f7f9ff");
    expect(cardPalette("dark")).toMatchObject({ link: "#7aa2ffff", glow: "#3565e859" });
    expect(cardPalette("brand")).toMatchObject({ background: "#f5f1e8ff", glow: "#c8a24c3d" });
    expect(cardPalette("nope" as "light")).toEqual(cardPalette("light"));
    const custom = { version: 1, name: "Navy", colors: { light: { background: "#fbfaf7", link: "#1a2740" }, dark: { background: "oklch(0.2 0.02 250)" } } } as const;
    expect(cardPalette(custom, "light")).toMatchObject({ background: "#fbfaf7ff", link: "#1a2740ff" });
    expect(cardPalette(custom, "dark").background).toMatch(/^#[0-9a-f]{6}ff$/);
    expect(cardPalette({ version: 1, name: "x", colors: { light: { background: "url(https://evil.example)" }, dark: {} } } as never)).toEqual(cardPalette("light"));
  });
});
