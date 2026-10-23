import { securityHeaders } from "@/lib/security-headers";

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
    expect(headers["Cache-Control"]).toBe("no-store, no-transform");
    expect(headers["Permissions-Policy"]).toContain("camera=()");
  });

  it("widens only the sources the app names", () => {
    const h = securityHeaders({ nonce: "n", connectSrc: ["https://api.example.com"], imgSrc: ["https://cdn.example.com"], frameAncestors: ["https://portal.example.com"] });
    expect(h["Content-Security-Policy"]).toContain("connect-src 'self' https://api.example.com");
    expect(h["Content-Security-Policy"]).toContain("img-src 'self' data: https://cdn.example.com");
    expect(h["Content-Security-Policy"]).toContain("frame-ancestors https://portal.example.com");
    expect(h["X-Frame-Options"]).toBe("SAMEORIGIN");
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
});
