import { shareMetadata, type ShareMetadataOptions } from "@/registry/aedis/lib/share-metadata";

const page: ShareMetadataOptions = {
  site: { origin: "https://ui.aedis.build", name: "Aedis UI" },
  url: "https://ui.aedis.build/docs/button",
  title: "Button",
  description: "The one main action per area.",
  image: { url: "https://ui.aedis.build/docs/button/opengraph-image.png", alt: "Button · Aedis UI" },
  type: "article",
};

describe("shareMetadata", () => {
  it("returns every Open Graph and Twitter tag a link preview reads", () => {
    expect(shareMetadata(page)).toEqual({
      title: "Button",
      description: "The one main action per area.",
      alternates: { canonical: "https://ui.aedis.build/docs/button" },
      openGraph: {
        type: "article",
        url: "https://ui.aedis.build/docs/button",
        siteName: "Aedis UI",
        title: "Button",
        description: "The one main action per area.",
        images: [{ url: "https://ui.aedis.build/docs/button/opengraph-image.png", width: 1200, height: 630, alt: "Button · Aedis UI" }],
      },
      twitter: { card: "summary_large_image", title: "Button", description: "The one main action per area.", images: [{ url: "https://ui.aedis.build/docs/button/opengraph-image.png", alt: "Button · Aedis UI" }] },
    });
    expect(shareMetadata({ ...page, type: undefined }).openGraph).toMatchObject({ type: "website" });
  });

  it("rejects a relative, foreign-origin, non-https or scripted image or page URL", () => {
    for (const url of ["/docs/button/opengraph-image.png", "https://evil.example/card.png", "http://ui.aedis.build/card.png", "javascript:alert(1)", "//ui.aedis.build/card.png", "https://ui.aedis.build.evil.example/x", "", "https://ui.aedis.build/‮x"]) {
      expect(() => shareMetadata({ ...page, image: { ...page.image, url } }), url).toThrow("image.url must be an absolute https URL on https://ui.aedis.build");
      expect(() => shareMetadata({ ...page, url }), url).toThrow("url must be an absolute https URL");
    }
  });

  it("needs an https site origin and an alt text, and strips hidden characters from the text", () => {
    expect(() => shareMetadata({ ...page, site: { ...page.site, origin: "http://ui.aedis.build" } })).toThrow("site.origin must be an https origin");
    expect(() => shareMetadata({ ...page, site: { ...page.site, origin: "*" } })).toThrow("site.origin must be an https origin");
    expect(() => shareMetadata({ ...page, image: { ...page.image, alt: " ​ " } })).toThrow("image.alt is required");
    const m = shareMetadata({ ...page, title: "But​ton‮", description: "  two\n lines " });
    expect([m.title, m.description]).toEqual(["Button", "two lines"]);
  });
});
