import type { NextConfig } from "next";

// Static export: the site and the registry JSON are plain files served by GitHub Pages.
// BASE_PATH is set by the Pages workflow when the site is served from a subpath.
const config: NextConfig = {
  output: "export",
  basePath: process.env.BASE_PATH || undefined,
  images: { unoptimized: true },
  poweredByHeader: false,
};

export default config;
