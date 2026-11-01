import { LogoCloud } from "@/registry/aedis/blocks/logo-cloud";

const clients = [
  { name: "Ceramics studio", logo: "/media/work-1.svg", width: 43, height: 32 },
  { name: "Garden centre", logo: "/media/work-2.svg", width: 43, height: 32 },
  { name: "Bakery", logo: "/media/work-3.svg", width: 43, height: 32 },
  { name: "Hotel", logo: "/media/work-4.svg", width: 43, height: 32 },
  { name: "Wine bar" },
  { name: "Music school", href: "/blocks/proof-list" },
];

export default function LogoCloudDemo() {
  return (
    <div className="grid gap-2">
      <LogoCloud title="Trusted by" clients={clients} />
      {/* The strip under a hero: no visible title, one row split by hairlines. */}
      <LogoCloud variant="row" label="Stack" clients={[{ name: "Next.js" }, { name: "Cloudflare" }, { name: "Postgres" }, { name: "TypeScript" }, { name: "Stripe" }, { name: "Playwright" }]} />
    </div>
  );
}
