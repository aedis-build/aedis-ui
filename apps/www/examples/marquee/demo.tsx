import { Marquee } from "@/registry/aedis/ui/marquee";

const services = ["Brand identity", "Campaigns", "Packaging", "Editorial design", "Motion", "Websites", "Photography"];

export default function MarqueeDemo() {
  return (
    <Marquee
      speed={30}
      className="w-full max-w-3xl py-2"
      items={services.map((s) => (
        <span key={s} className="text-title-2 whitespace-nowrap">
          {s} <span aria-hidden="true" className="text-muted-foreground">·</span>
        </span>
      ))}
    />
  );
}
