/** The four ways to compose apps, as the guide (/docs/micro-frontends) and the landing page (/micro-frontends) show them. */
export const approaches: [name: string, use: string, boundary: string, integration: string][] = [
  ["iframe (mf-frame + mf-bridge)", "A panel from another team or another trust level inside your page: an agent console in a back office.", "Separate origin and sandbox; talks only through a checked, typed channel; headers on both sides say who may frame whom.", "Its own layout box; height comes over the bridge; no shared styles."],
  ["Web Component (mf-element)", "A widget tied to the host's layout that the host trusts as its own code.", "None between the two: the element runs in the host's origin and sees what the page sees.", "Shadow DOM keeps CSS apart; props and events cross directly."],
  ["Multi-Zones", "Whole pages split by path on one site: /docs from one app, /app from another.", "Same origin, so shared cookies; each zone sends its own CSP.", "Navigating to another zone is a full page load."],
  ["Module Federation", "Not recommended with the App Router.", "Remote code loaded at runtime into the host's origin, outside your build's integrity checks.", "Server Components, streaming and the App Router's bundling are not designed for it; the Next.js plugins target the Pages Router."],
];

/** The landing page's verdict per approach, in the same order. */
export const verdicts = ["Recommended across teams", "Same team only", "Separate apps, one product", "Not recommended"] as const;

/** What the kit defends, each with the test that proves it (file, test name). */
export const defends: { title: string; text: string; proof: [file: string, test: string] }[] = [
  {
    title: "A remote reads the session",
    text: "The bridge refuses to send anything that looks like a secret, and oversized payloads. Tokens stay in the shell.",
    proof: ["mf-bridge.test.ts", "refuses to send secrets or oversized payloads"],
  },
  {
    title: "A remote frames you",
    text: "frame-ancestors on the embedded app and frame-src on the host name each other; a wildcard is never accepted.",
    proof: ["mf-frame.test.tsx", "lets only configured hosts frame the embedded app, never a wildcard"],
  },
  {
    title: "Forged messages",
    text: "mf-bridge drops every message from another origin or window, and every message that does not match its type.",
    proof: ["mf-bridge.test.ts", "always drops messages from other origins or other windows (property)"],
  },
  {
    title: "A remote hangs",
    text: "Requests over the bridge time out (5 s by default) and never say why the other side failed; the shell moves on.",
    proof: ["mf-bridge.test.ts", "matches requests and responses by id, times out, and never says why the other side failed"],
  },
];
