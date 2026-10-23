// @vitest-environment node
import { ImageResponse } from "next/og";

import { components } from "@/content/components";
import { pageMetadata, shareCard, shareImageFile, sharePages } from "@/content/share";
import { SHARE_CARD_SIZE, shareCardFonts } from "@/registry/aedis/ui/share-card";

const fetches: string[] = [];
beforeAll(() => {
  const real = globalThis.fetch;
  vi.stubGlobal("fetch", (url: string | URL, init?: RequestInit) => {
    if (String(url).startsWith("data:")) return real(url, init);
    fetches.push(String(url));
    return Promise.reject(new Error("a share card fetched a URL"));
  });
});
afterAll(() => vi.unstubAllGlobals());

describe("site share cards", () => {
  it("draw every section's art without reaching any host", async () => {
    const fonts = await shareCardFonts();
    const one = [...new Map(sharePages().map((p) => [`${p.section}-${p.theme ?? "light"}`, p])).values()];
    for (const page of one) {
      const png = Buffer.from(await new ImageResponse(shareCard(page), { ...SHARE_CARD_SIZE, fonts }).arrayBuffer());
      expect([png.readUInt32BE(16), png.readUInt32BE(20)], page.path).toEqual([1200, 630]);
    }
    expect(one.length).toBeGreaterThanOrEqual(6);
    expect(fetches).toEqual([]);
  }, 60_000);

  it("cover every docs entry once, with a file name unique to what the card shows", () => {
    const pages = sharePages();
    const paths = pages.map((p) => p.path);
    expect(new Set(paths).size).toBe(paths.length);
    for (const c of components) expect(paths).toContain(`/docs/${c.name}`);
    const files = pages.map(shareImageFile);
    expect(new Set(files).size).toBe(files.length);
    for (const f of files) expect(f).toMatch(/^[a-z0-9-]+-[0-9a-f]{12}\.png$/);
    const button = pages.find((p) => p.path === "/docs/button")!;
    expect(shareImageFile({ ...button, title: "Other" })).not.toBe(shareImageFile(button));
  });

  it("give each page its card as og:image, and refuse a page without one", () => {
    const meta = pageMetadata("/docs/button");
    expect(meta.openGraph).toMatchObject({ url: "https://ui.aedis.build/docs/button", type: "article", images: [{ url: expect.stringMatching(/^https:\/\/ui\.aedis\.build\/og\/docs-button-[0-9a-f]{12}\.png$/) }] });
    expect(pageMetadata("/").openGraph).toMatchObject({ type: "website" });
    expect(() => pageMetadata("/nope")).toThrow("no share card for /nope");
  });
});
