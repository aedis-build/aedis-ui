import { Marquee } from "@/registry/aedis/ui/marquee";

const clients = ["Norte Hotéis", "Casa Brava", "Atelier Lume", "Mercado Sul", "Vila Serena", "Estúdio Prisma"];

export default function MarqueeBackdrop() {
  return (
    <div className="relative grid w-full max-w-3xl place-items-center overflow-hidden rounded-md border border-hairline bg-surface py-12">
      <Marquee
        variant="backdrop"
        lines={2}
        speed={70}
        className="absolute inset-0"
        items={clients.map((c) => (
          <span key={c} className="text-display font-semibold whitespace-nowrap">{c}</span>
        ))}
      />
      {/* The backdrop is decoration: the same clients are listed here, where everyone can read them. */}
      <div className="relative grid gap-2 px-6 text-center">
        <p className="text-title-2">Trusted by</p>
        <p className="text-callout text-muted-foreground">{clients.join(", ")}.</p>
      </div>
    </div>
  );
}
