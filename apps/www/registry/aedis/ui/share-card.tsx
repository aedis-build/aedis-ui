import type { ReactNode } from "react";

import { stripInvisible } from "@/lib/untrusted";
import { parseColor } from "@/registry/aedis/lib/contrast";
import { themeVariables, validateTheme, type CustomTheme, type ThemeMode } from "@/registry/aedis/lib/custom-theme";
import { colors, fonts, themeNames, type ColorName, type ThemeName } from "@/registry/aedis/lib/tokens";

/** The Open Graph image size every chat app and network crops to. */
export const SHARE_CARD_SIZE = { width: 1200, height: 630 } as const;

/** The most characters each text may have; longer text ends with an ellipsis instead of leaving the card. */
export const SHARE_CARD_LIMITS = { brand: 32, eyebrow: 40, title: 72, description: 150, chip: 24, chips: 4, domain: 40 } as const;

/**
 * The characters the bundled Geist covers: Latin with the accents of English, Portuguese, Spanish and the other
 * Western European languages, and common punctuation. next/og fetches a font from Google, or an emoji from a CDN,
 * for any character its fonts lack; dropping those keeps the build from reaching any host.
 */
const UNCOVERED = /[^ -~¡-¨ª-­¯-ſ–—‘’“”…•]/gu;

/** Text as the card draws it: no hidden or unsupported characters, one line of spaces, at most `max` characters. */
export function cardText(value: unknown, max: number): string {
  const text = stripInvisible(typeof value === "string" ? value : "")
    .normalize("NFC")
    .replace(UNCOVERED, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  // End on a word when one ends near the limit, otherwise mid-word (a long unbreakable string).
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,.;:–—-]+$/, "")}…`;
}

/**
 * The chips that fit on the bottom row next to the domain, in order. Widths are estimated from Geist's average
 * letter at the card's sizes; the row also clips, so a chip of only wide letters never reaches the art.
 */
export function fitChips(chips: string[], domain: string, row = 1200 - 2 * 72 - 430 - 56): string[] {
  let room = row - (domain ? domain.length * 9.5 + 10 : 0);
  const out: string[] = [];
  for (const chip of chips) {
    room -= chip.length * 11 + 32 + 10;
    if (room < 0) break;
    out.push(chip);
  }
  return out;
}

type Palette = Record<"background" | "foreground" | "muted" | "link" | "chip" | "glow", string>;

/** A theme color (hex, rgba or oklch) as #rrggbbaa, which Satori reads; `alpha` overrides its opacity. */
const hex = (value: string, alpha?: number) => {
  const [r, g, b, a] = parseColor(value);
  return `#${[r, g, b, Math.round((alpha ?? a) * 255)].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
};

/** The card's colors from the theme tokens. A custom theme is validated first; an invalid one falls back to light. */
export function cardPalette(theme: ThemeName | CustomTheme = "light", mode: ThemeMode = "light"): Palette {
  let pick: (name: ColorName) => string;
  let dark = false;
  // The glow behind the art: the primary color, or the brand's gold, since its primary is the text's navy.
  let glow: [ColorName, number] = ["primary", 0.16];
  if (typeof theme === "string") {
    const name = themeNames.includes(theme) ? theme : "light";
    pick = (n) => colors[n][name];
    dark = name === "dark";
    if (name === "brand") glow = ["accent", 0.24];
  } else {
    const result = validateTheme(theme);
    const vars = result.ok ? themeVariables(result.theme, mode) : null;
    pick = (n) => vars?.[`--${n}`] ?? colors[n].light;
    dark = result.ok && mode === "dark";
  }
  return {
    background: hex(pick("background")),
    foreground: hex(pick("foreground")),
    muted: hex(pick("muted-foreground")),
    link: hex(pick("link")),
    chip: hex(pick("accent-soft")),
    glow: hex(pick(glow[0]), dark ? 0.35 : glow[1]),
  };
}

export type ShareCardProps = {
  /** The product name, and its logo as a local SVG node (never a remote image). */
  brand: { name: string; logo?: ReactNode };
  /** The section, drawn in capitals above the title. */
  eyebrow?: string;
  title: string;
  description?: string;
  /** Up to four short tags at the bottom. */
  chips?: string[];
  /** The site, at the bottom right: "ui.aedis.build". */
  domain?: string;
  /** The illustration on the right, 430×300: a local React or SVG node. */
  art?: ReactNode;
  /** A built-in theme, or a custom theme (validated; `mode` picks its light or dark colors). */
  theme?: ThemeName | CustomTheme;
  mode?: ThemeMode;
};

/**
 * A 1200×630 share card (Open Graph image) as JSX for next/og's ImageResponse: flexbox and inline styles only, the
 * subset Satori draws. Every text is bounded and limited to the bundled font, and nothing in it loads a URL.
 */
function ShareCard({ brand, eyebrow, title, description, chips = [], domain, art, theme = "light", mode }: ShareCardProps) {
  const c = cardPalette(theme, mode);
  const site = cardText(domain, SHARE_CARD_LIMITS.domain);
  const tags = fitChips(chips.slice(0, SHARE_CARD_LIMITS.chips).map((chip) => cardText(chip, SHARE_CARD_LIMITS.chip)).filter(Boolean), site);
  const kicker = cardText(eyebrow, SHARE_CARD_LIMITS.eyebrow).toUpperCase();
  const lead = cardText(description, SHARE_CARD_LIMITS.description);
  return (
    <div
      style={{
        width: SHARE_CARD_SIZE.width,
        height: SHARE_CARD_SIZE.height,
        display: "flex",
        alignItems: "center",
        gap: 56,
        padding: "64px 72px",
        backgroundColor: c.background,
        // Fades to the same color at zero alpha: "transparent" is transparent black, which greys the glow on the way.
        backgroundImage: `radial-gradient(800px 420px at 85% 20%, ${c.glow}, ${c.glow.slice(0, 7)}00 60%)`,
        color: c.foreground,
        // Geist in next/og (bundled); the theme's sans stack where the card is shown in a page.
        fontFamily: `Geist, ${fonts.sans}`,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, minWidth: 0, height: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {brand.logo ? <div style={{ display: "flex", width: 44, height: 44 }}>{brand.logo}</div> : null}
          <span style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em" }}>{cardText(brand.name, SHARE_CARD_LIMITS.brand)}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {kicker ? <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: "0.06em", color: c.link }}>{kicker}</span> : null}
          <span style={{ display: "block", fontSize: 64, lineHeight: 1.02, letterSpacing: "-0.035em", fontWeight: 700, lineClamp: 3, wordBreak: "break-word" }}>
            {cardText(title, SHARE_CARD_LIMITS.title)}
          </span>
          {lead ? <span style={{ display: "block", fontSize: 26, lineHeight: 1.35, color: c.muted, lineClamp: 2, wordBreak: "break-word" }}>{lead}</span> : null}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, width: "100%", overflow: "hidden" }}>
          <div style={{ display: "flex", gap: 10 }}>
            {tags.map((tag) => (
              <span key={tag} style={{ fontSize: 20, fontWeight: 600, padding: "8px 16px", borderRadius: 999, backgroundColor: c.chip, color: c.link, whiteSpace: "nowrap", flexShrink: 0 }}>
                {tag}
              </span>
            ))}
          </div>
          {site ? <span style={{ fontSize: 22, color: c.muted, whiteSpace: "nowrap", flexShrink: 0 }}>{site}</span> : null}
        </div>
      </div>
      {art ? <div style={{ display: "flex", justifyContent: "center", width: 430, height: 300, flexShrink: 0, overflow: "hidden" }}>{art}</div> : null}
    </div>
  );
}

/** The fonts the card is drawn with, read from the `geist` package (SIL Open Font License) at build time. */
async function shareCardFonts(root = process.cwd()) {
  const { readFile } = await import("node:fs/promises");
  const { join } = await import("node:path");
  const dir = join(root, "node_modules", "geist", "dist", "fonts", "geist-sans");
  const load = (file: string, weight: 400 | 600 | 700) =>
    readFile(join(dir, file)).then((data) => ({ name: "Geist", data: data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer, weight, style: "normal" as const }));
  return Promise.all([load("Geist-Regular.ttf", 400), load("Geist-SemiBold.ttf", 600), load("Geist-Bold.ttf", 700)]);
}

export { ShareCard, shareCardFonts };
