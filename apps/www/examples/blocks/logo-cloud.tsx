import { LogoCloud } from "@/registry/aedis/blocks/logo-cloud";

export default function LogoCloudDemo() {
  return (
    <LogoCloud
      title="Trusted by"
      clients={[
        { name: "Ceramics studio", logo: "/media/work-1.svg" },
        { name: "Garden centre", logo: "/media/work-2.svg" },
        { name: "Bakery", logo: "/media/work-3.svg" },
        { name: "Hotel", logo: "/media/work-4.svg" },
        { name: "Wine bar" },
        { name: "Music school", href: "/blocks/proof-list" },
      ]}
    />
  );
}
