/** [r, g, b] in 0–255 and alpha in 0–1. */
export type Rgba = [number, number, number, number];

const NUM = String.raw`(\d+(?:\.\d+)?|\.\d+)`;
const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const RGBA = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(0|1|0?\.\d+)\s*)?\)$/i;
const OKLCH = new RegExp(String.raw`^oklch\(\s*${NUM}(%?)\s+${NUM}\s+${NUM}(?:deg)?\s*(?:\/\s*${NUM}(%?)\s*)?\)$`, "i");

export type Oklch = { l: number; c: number; h: number; alpha: number };

/** Reads oklch(L C H [/ A]) with L in 0–1 or 0–100 %, C in 0–0.5, H in 0–360. Null when malformed or out of range. */
export function parseOklch(value: string): Oklch | null {
  const m = OKLCH.exec(value);
  if (!m) return null;
  const l = m[2] ? Number(m[1]) / 100 : Number(m[1]);
  const alpha = m[5] === undefined ? 1 : m[6] ? Number(m[5]) / 100 : Number(m[5]);
  const c = Number(m[3]);
  const h = Number(m[4]);
  if (l > 1 || c > 0.5 || h > 360 || alpha > 1) return null;
  return { l, c, h, alpha };
}

/** OKLCH to sRGB (0–255, clamped to the gamut). */
export function oklchToRgba({ l, c, h, alpha }: Oklch): Rgba {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const linear = [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
  const gamma = (x: number) => (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055);
  const [r, g, bl] = linear.map((x) => Math.round(Math.min(1, Math.max(0, gamma(x))) * 255));
  return [r, g, bl, alpha];
}

/** Reads #rgb, #rrggbb, #rrggbbaa, rgb()/rgba() and oklch(). Throws on anything else. */
export function parseColor(value: string): Rgba {
  const hex = HEX.exec(value);
  if (hex) {
    const h = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join("") : hex[1];
    const [r, g, b, a = 255] = [0, 2, 4, 6].filter((i) => i < h.length).map((i) => parseInt(h.slice(i, i + 2), 16));
    return [r, g, b, a / 255];
  }
  const rgba = RGBA.exec(value);
  if (rgba && rgba.slice(1, 4).every((c) => Number(c) <= 255)) {
    return [Number(rgba[1]), Number(rgba[2]), Number(rgba[3]), rgba[4] === undefined ? 1 : Number(rgba[4])];
  }
  const oklch = parseOklch(value);
  if (oklch) return oklchToRgba(oklch);
  throw new Error(`Unsupported color: ${value}`);
}

const over = ([r, g, b, a]: Rgba, [br, bg, bb]: Rgba): Rgba => [r * a + br * (1 - a), g * a + bg * (1 - a), b * a + bb * (1 - a), 1];

const luminance = ([r, g, b]: Rgba) => {
  const lin = (c: number) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};

/** WCAG contrast ratio. Translucent colors are composited over `page` (white by default). */
export function contrast(foreground: string, background: string, page = "#ffffff") {
  const bg = over(parseColor(background), parseColor(page));
  const fg = over(parseColor(foreground), bg);
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return (hi + 0.05) / (lo + 0.05);
}

/** Euclidean distance in sRGB, 0–1: how far apart two opaque colors look at a glance. */
export function colorDistance(a: string, b: string) {
  const [x, y] = [parseColor(a), parseColor(b)];
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]) / (255 * Math.sqrt(3));
}
