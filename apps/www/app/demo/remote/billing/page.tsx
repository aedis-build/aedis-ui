import type { Metadata } from "next";

import { MfDemoRemote } from "@/components/site/mf-demo-remote";

export const metadata: Metadata = { title: "Billing remote", robots: { index: false } };

/** The remote of the /micro-frontends demo, alone: only the site's own pages may frame it (scripts/headers.ts). */
export default function BillingRemote() {
  return (
    <main id="main" data-bare>
      <MfDemoRemote />
    </main>
  );
}
