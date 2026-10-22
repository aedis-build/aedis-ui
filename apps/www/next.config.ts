import type { NextConfig } from "next";

// Static export: the site and the registry JSON are plain files served by Cloudflare Workers static assets at
// https://ui.aedis.build (wrangler.jsonc); scripts/headers.ts writes their security headers to out/_headers.
const config: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  poweredByHeader: false,
};

export default config;
