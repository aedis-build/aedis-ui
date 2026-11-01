import { Button } from "@/registry/aedis/ui/button";
import { Link } from "@/registry/aedis/ui/link";
import { Marquee } from "@/registry/aedis/ui/marquee";
import { SiteFooter } from "@/registry/aedis/ui/site-footer";
import { TextMask } from "@/registry/aedis/ui/text-mask";

const clients = ["Norte Hotéis", "Casa Brava", "Atelier Lume", "Mercado Sul", "Vila Serena"];

// A page in a box: the opaque page scrolls off the footer, which waits behind it like a curtain.
export default function SiteFooterReveal() {
  return (
    <div data-slot="footer-demo" role="group" tabIndex={0} aria-label="A page with a curtain footer" className="focus-ring h-[75svh] w-full overflow-y-auto rounded-md border border-hairline">
      <div className="relative z-10 bg-surface">
        <section className="grid min-h-[75svh] content-center gap-3 px-6">
          <p className="text-display font-semibold">RLFN Studio</p>
          <p className="text-callout text-muted-foreground">Scroll down: the page lifts off the footer.</p>
        </section>
        <section className="grid min-h-[50svh] content-center gap-2 border-t border-hairline px-6">
          <p className="text-title-2">The work</p>
          <p className="text-callout text-muted-foreground">Six projects, each told in a picture and a line.</p>
        </section>
      </div>
      <SiteFooter
        reveal
        className="min-h-full"
        links={[
          { label: "Work", href: "#work" },
          { label: "Studio", href: "#studio" },
          { label: "Instagram", href: "https://instagram.com/" },
        ]}
        backdrop={<Marquee variant="backdrop" lines={2} speed={70} className="absolute inset-0" items={clients.map((c) => <span key={c} className="text-display font-semibold whitespace-nowrap">{c}</span>)} />}
        closing={
          <div className="grid gap-6">
            <TextMask text="RLFN STUDIO" label="RLFN Studio" image="/media/work-2.svg" className="rounded-md" />
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-title-2">The next scene could be yours.</p>
              <Button shape="pill" render={<a href="#contact" />}>
                Talk to us
              </Button>
            </div>
          </div>
        }
        credits={{
          left: "© 2026 RLFN Studio",
          right: "Photographs: the studio",
          center: (
            <>
              Built by <Link href="https://example.com/rlfn-tech">RLFN Tech</Link>
            </>
          ),
        }}
      />
    </div>
  );
}
