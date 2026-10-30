import { cachePolicyFor, securityHeaders, type CachePolicy } from "@/lib/security-headers";

describe("securityHeaders", () => {
  const headers = securityHeaders({ nonce: "n0nce" });
  const csp = Object.fromEntries(headers["Content-Security-Policy"].split("; ").map((d) => [d.split(" ")[0], d]));

  it("allows no inline script, eval, plugin, framing or foreign form target", () => {
    expect(csp["script-src"]).toBe("script-src 'self' 'nonce-n0nce' 'strict-dynamic'");
    expect(csp["object-src"]).toBe("object-src 'none'");
    expect(csp["base-uri"]).toBe("base-uri 'none'");
    expect(csp["form-action"]).toBe("form-action 'self'");
    expect(csp["frame-ancestors"]).toBe("frame-ancestors 'none'");
    expect(headers["Content-Security-Policy"]).not.toContain("unsafe-eval");
    expect(headers["X-Frame-Options"]).toBe("DENY");
  });

  it("sets transport, sniffing, referrer, isolation and caching headers", () => {
    expect(headers["Strict-Transport-Security"]).toContain("max-age=63072000");
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["Cross-Origin-Opener-Policy"]).toBe("same-origin");
    expect(headers["Cache-Control"]).toBe("no-store");
    expect(headers["Permissions-Policy"]).toContain("camera=()");
  });

  it("widens only the sources the app names", () => {
    const h = securityHeaders({ nonce: "n", connectSrc: ["https://api.example.com"], imgSrc: ["https://cdn.example.com"], frameAncestors: ["https://portal.example.com"] });
    expect(h["Content-Security-Policy"]).toContain("connect-src 'self' https://api.example.com");
    expect(h["Content-Security-Policy"]).toContain("img-src 'self' data: https://cdn.example.com");
    expect(h["Content-Security-Policy"]).toContain("frame-ancestors https://portal.example.com");
    expect(h["X-Frame-Options"]).toBe("SAMEORIGIN");
  });

  it("refuses an injected <style> element but keeps the components' style attributes", () => {
    expect(csp["style-src-elem"]).toBe("style-src-elem 'self' 'nonce-n0nce'");
    expect(csp["style-src-attr"]).toBe("style-src-attr 'unsafe-inline'");
    // No style-src: a browser without the split directives falls back to default-src 'self', never to 'unsafe-inline'.
    expect(csp["style-src"]).toBeUndefined();
    const h = securityHeaders({ hashes: [], styleHashes: ["sha256-AbC+/12="] });
    expect(h["Content-Security-Policy"]).toContain("style-src-elem 'self' 'sha256-AbC+/12='; style-src-attr 'unsafe-inline';");
    expect(() => securityHeaders({ nonce: "n", styleHashes: ["unsafe-inline"] })).toThrow("not a style hash: unsafe-inline");
  });

  it("takes build-time script hashes for a static site", () => {
    const h = securityHeaders({ hashes: ["sha256-AbC+/12=", "sha384-xyz"] });
    // No 'strict-dynamic': it would make browsers ignore 'self' and block the site's own <script src>.
    expect(h["Content-Security-Policy"]).toContain("script-src 'self' 'sha256-AbC+/12=' 'sha384-xyz';");
  });

  it("refuses a policy it cannot make strict", () => {
    expect(() => securityHeaders({})).toThrow("either nonce or hashes");
    expect(() => securityHeaders({ nonce: "n", hashes: [] })).toThrow("either nonce or hashes");
    expect(() => securityHeaders({ nonce: "n' 'unsafe-inline" })).toThrow("base64");
    expect(() => securityHeaders({ hashes: ["sha256-ok=", "unsafe-inline"] })).toThrow("not a script hash: unsafe-inline");
  });

  it("allows media and fonts only from the exact origins named (#201)", () => {
    expect(csp["media-src"]).toBeUndefined();
    expect(csp["font-src"]).toBe("font-src 'self'");
    const h = securityHeaders({ nonce: "n", mediaSrc: ["https://media.example.com/", "*", "https://*.example.com", "http://x.test/path"], fontSrc: ["https://fonts.example.com", "*.cdn.com"] });
    const d = Object.fromEntries(h["Content-Security-Policy"].split("; ").map((x) => [x.split(" ")[0], x]));
    expect(d["media-src"]).toBe("media-src 'self' https://media.example.com");
    expect(d["font-src"]).toBe("font-src 'self' https://fonts.example.com");
    expect(securityHeaders({ nonce: "n", mediaSrc: [] })["Content-Security-Policy"]).toContain("media-src 'self';");
  });

  it("upgrades insecure requests unless the origin is plain HTTP (#201)", () => {
    expect(csp["upgrade-insecure-requests"]).toBe("upgrade-insecure-requests");
    expect(securityHeaders({ nonce: "n", upgradeInsecureRequests: false })["Content-Security-Policy"]).not.toContain("upgrade-insecure-requests");
  });
});

describe("cache policy per response (#231)", () => {
  const csp = (h: Record<string, string>) => Object.fromEntries(h["Content-Security-Policy"]!.split("; ").map((d) => [d.split(" ")[0], d]));

  it("is no-store by default, so forgetting the option never makes a page cacheable", () => {
    expect(securityHeaders({ nonce: "n" })["Cache-Control"]).toBe("no-store");
    expect(securityHeaders({ nonce: "n", cacheControl: "private" })["Cache-Control"]).toBe("no-store");
  });

  it("writes each preset, none with no-transform, so a proxy may compress the response (#239)", () => {
    expect(securityHeaders({ cacheControl: "public" })["Cache-Control"]).toBe("public, max-age=3600, stale-while-revalidate=86400");
    expect(securityHeaders({ cacheControl: "immutable" })["Cache-Control"]).toBe("public, max-age=31536000, immutable");
    for (const cacheControl of ["private", "public", "immutable"] as const) {
      expect(securityHeaders({ hashes: [], cacheControl })["Cache-Control"]).not.toContain("no-transform");
    }
  });

  it("refuses a nonce on a cacheable response, and any value that is not a preset", () => {
    expect(() => securityHeaders({ nonce: "n", cacheControl: "public" })).toThrow(/never cached/);
    expect(() => securityHeaders({ nonce: "n", cacheControl: "immutable" })).toThrow(/never cached/);
    for (const bad of ["no-cache", "public\r\nSet-Cookie: x=1", "", "PUBLIC"]) {
      expect(() => securityHeaders({ hashes: [], cacheControl: bad as CachePolicy }), bad).toThrow(/must be private, public or immutable/);
    }
  });

  it("runs no script on a cacheable response without nonce or hashes, and keeps hashes when given", () => {
    expect(csp(securityHeaders({ cacheControl: "public" }))["script-src"]).toBe("script-src 'none'");
    const hash = "sha256-" + "A".repeat(43) + "=";
    expect(csp(securityHeaders({ cacheControl: "public", hashes: [hash] }))["script-src"]).toBe(`script-src 'self' '${hash}'`);
  });

  it("still asks a private response for a nonce or hashes", () => {
    expect(() => securityHeaders({})).toThrow(/give either nonce or hashes/);
    expect(() => securityHeaders({ cacheControl: "private" })).toThrow(/give either nonce or hashes/);
  });

  it("picks the policy per path: exact strings, RegExps, private otherwise, public when both match", () => {
    const lists = { public: ["/sitemap.xml", "/robots.txt", /^\/llms/], immutable: [/^\/_next\/static\//, "/llms-full.txt"] };
    expect(cachePolicyFor("/sitemap.xml", lists)).toBe("public");
    expect(cachePolicyFor("/sitemap.xml/x", lists)).toBe("private");
    expect(cachePolicyFor("/llms.txt", lists)).toBe("public");
    expect(cachePolicyFor("/_next/static/chunks/a.js", lists)).toBe("immutable");
    expect(cachePolicyFor("/llms-full.txt", lists)).toBe("public");
    expect(cachePolicyFor("/account", lists)).toBe("private");
    expect(cachePolicyFor("/sitemap.xml")).toBe("private");
    const sticky = /^\/feed/g;
    expect([cachePolicyFor("/feed", { public: [sticky] }), cachePolicyFor("/feed", { public: [sticky] })]).toEqual(["public", "public"]);
  });
});
