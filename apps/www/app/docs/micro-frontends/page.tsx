import type { Metadata } from "next";

import { approaches as options } from "@/content/micro-frontends";
import { pageMetadata } from "@/content/share";
import { CodeBlock } from "@/registry/aedis/ui/code-block";

export const metadata: Metadata = pageMetadata("/docs/micro-frontends");

const th = "py-2 pr-4 text-left text-footnote font-medium text-muted-foreground";
const td = "py-2 pr-4 align-top";

export default function MicroFrontends() {
  return (
    <article className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-title-1">Micro-frontends</h1>
        <p className="text-body text-muted-foreground">
          Pick the approach by the boundary you need, not by how the code is split. The question is: how much should these two apps trust each other?
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-title-2">Choosing an approach</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-callout">
            <thead>
              <tr>
                <th className={th}>Approach</th>
                <th className={th}>Use it for</th>
                <th className={th}>Security boundary</th>
                <th className={th}>Integration</th>
              </tr>
            </thead>
            <tbody>
              {options.map(([name, use, boundary, integration]) => (
                <tr key={name} className="border-t border-border">
                  <td className={`${td} font-medium`}>{name}</td>
                  <td className={td}>{use}</td>
                  <td className={td}>{boundary}</td>
                  <td className={td}>{integration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="list-disc space-y-1 pl-5 text-callout">
          <li>Different teams, different release cycles or different trust: iframe.</li>
          <li>One team, one trust level, a piece that must sit inside the host&apos;s layout: Web Component.</li>
          <li>Separate apps that each own whole pages of one product: Multi-Zones.</li>
          <li>Never pass a token across any of these boundaries: keep the session in a same-site HttpOnly cookie, or put a BFF in front of the API (bffStream).</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-title-2">Multi-Zones on the same site</h2>
        <p className="text-callout text-muted-foreground">
          The main app serves the site and rewrites the paths another zone owns to it. The browser only ever sees one origin, so the session
          cookie, CORS-free API calls and the same-origin rules of <code className="font-mono">api()</code> keep working.
        </p>
        <CodeBlock
          lang="ts"
          title="main app: next.config.ts"
          code={`const DOCS = process.env.DOCS_ZONE_URL; // e.g. https://docs-zone.internal

const config: NextConfig = {
  async rewrites() {
    return [
      { source: "/docs", destination: \`\${DOCS}/docs\` },
      { source: "/docs/:path+", destination: \`\${DOCS}/docs/:path+\` },
      { source: "/docs-static/:path+", destination: \`\${DOCS}/docs-static/:path+\` },
    ];
  },
};`}
        />
        <CodeBlock
          lang="ts"
          title="docs zone: next.config.ts"
          code={`const config: NextConfig = {
  basePath: "/docs",
  // Its own prefix, so its assets never collide with the main app's /_next.
  assetPrefix: "/docs-static",
  experimental: {
    // Requests arrive through the main app's host: allow it for Server Actions.
    serverActions: { allowedOrigins: ["www.example.com"] },
  },
};`}
        />
        <ul className="list-disc space-y-1 pl-5 text-callout">
          <li>
            <strong>Same-site deployment.</strong> Serve every zone through the main app&apos;s host. Keep the zones themselves off the public
            internet (or behind the same edge), so nobody reaches them around the main app&apos;s headers.
          </li>
          <li>
            <strong>Cookie scope.</strong> One origin means one cookie jar: set the session cookie <code className="font-mono">HttpOnly; Secure; SameSite=Lax</code> with{" "}
            <code className="font-mono">Path=/</code> when every zone needs it, or a narrower <code className="font-mono">Path</code> for a zone-only cookie. Never set{" "}
            <code className="font-mono">Domain</code> to a parent domain just to share it: that also shares it with every other subdomain.
          </li>
          <li>
            <strong>CSP per zone.</strong> Each zone renders its own pages, so each one applies <code className="font-mono">securityHeaders({"{ nonce }"})</code> in its own
            middleware with its own nonce. The main app&apos;s rewrite passes the zone&apos;s response headers through; do not let the main app overwrite them with a CSP
            whose nonce the zone never saw.
          </li>
          <li>
            <strong>Navigation.</strong> A link into another zone is a full page load: use a plain <code className="font-mono">&lt;a&gt;</code> rather than{" "}
            <code className="font-mono">next/link</code> for those paths.
          </li>
          <li>
            <strong>Idle and logout.</strong> Zones share the cookie, so signing out in one signs out everywhere; run <code className="font-mono">useIdleTimeout</code> in each zone.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-title-2">Embeds on another origin</h2>
        <ul className="list-disc space-y-1 pl-5 text-callout">
          <li>
            Host: <code className="font-mono">hostAppHeaders({"{ nonce, frameOrigins }"})</code> and <code className="font-mono">&lt;MfFrame&gt;</code>; embedded app:{" "}
            <code className="font-mono">embeddedAppHeaders({"{ nonce, hostOrigins }"})</code> and <code className="font-mono">useReportHeight</code>.
          </li>
          <li>Keep theme, locale and session in step with <code className="font-mono">mf-context</code>; logout in the host ends the embedded session.</li>
          <li>
            A cross-site iframe gets its cookies only with <code className="font-mono">SameSite=None; Secure</code> (and the browser may still block third-party cookies). Prefer
            putting the embedded app on a subdomain of the same site, or authenticate it through the host&apos;s BFF.
          </li>
        </ul>
      </section>
    </article>
  );
}
