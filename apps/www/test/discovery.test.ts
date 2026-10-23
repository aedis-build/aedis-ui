import sitemap from "@/app/sitemap";
import { robotsTxt } from "@/content/robots";
import { jsonLd, llmsAlternate, pageMetadata, sharePages } from "@/content/share";

describe("discoverability", () => {
  it("robots.txt lets every crawler in, with the content signals and the sitemap", () => {
    const lines = robotsTxt().split("\n");
    expect(lines).toEqual(expect.arrayContaining(["User-agent: *", "Allow: /", "Content-Signal: search=yes, ai-input=yes, ai-train=yes", "Sitemap: https://ui.aedis.build/sitemap.xml"]));
    expect(lines.filter((l) => /^Disallow:/i.test(l))).toEqual([]);
    expect(lines[0]).toMatch(/^# .*https:\/\/ui\.aedis\.build\/llms\.txt/);
  });

  it("the sitemap lists every shareable page once, with absolute URLs", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toEqual(sharePages().map((p) => `https://ui.aedis.build${p.path}`));
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls.some((u) => /\/blocks\/view\/|\/demo\/remote\//.test(u))).toBe(false);
  });

  it("links llms.txt from every page's head", () => {
    expect(pageMetadata("/charts").alternates).toMatchObject({ canonical: "https://ui.aedis.build/charts", types: llmsAlternate });
    expect(llmsAlternate["text/plain"]).toEqual([{ url: "https://ui.aedis.build/llms.txt", title: "llms.txt" }]);
  });

  it("describes every page as JSON-LD: the website, the source code, and a TechArticle on docs pages", () => {
    for (const page of sharePages()) {
      const data = JSON.parse(JSON.stringify(jsonLd(page.path))) as { "@context": string; "@graph": { "@type": string; url?: string }[] };
      expect(data["@context"]).toBe("https://schema.org");
      const types = data["@graph"].map((n) => n["@type"]);
      expect(types.slice(0, 2)).toEqual(["WebSite", "SoftwareSourceCode"]);
      expect(types[2]).toBe(page.path.startsWith("/docs/") ? "TechArticle" : "WebPage");
      expect(data["@graph"][2].url).toBe(`https://ui.aedis.build${page.path}`);
    }
    expect(jsonLd("/")["@graph"][1]).toMatchObject({ codeRepository: "https://github.com/aedis-build/aedis-ui", license: "https://www.apache.org/licenses/LICENSE-2.0" });
  });
});
