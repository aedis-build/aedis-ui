import { Hero } from "@/registry/aedis/blocks/hero";
import { Video } from "@/registry/aedis/ui/video";

export default function HeroDemo() {
  return (
    <Hero
      eyebrow="RLFN Studio"
      headline="Brands that people remember,"
      highlight="from the first mark to the last film."
      lead="Identity, websites and film for small companies with a lot to say."
      actions={[
        { label: "See the work", href: "/blocks/proof-list" },
        { label: "Start a project", href: "/blocks/cta-section", variant: "outline" },
      ]}
      media={<Video variant="background" autoplay src="/media/showreel.webm" type="video/webm" poster="/media/showreel-poster.svg" title="Studio reel" className="absolute inset-0 rounded-none" />}
    />
  );
}
