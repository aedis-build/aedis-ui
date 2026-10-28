import { cn } from "@/lib/utils";
import { MarketingActions, type MarketingAction } from "@/registry/aedis/blocks/hero";

export type CtaSectionProps = { headline: string; lead?: string; actions: MarketingAction[]; className?: string };

/** A closing call to action: a headline, a line and the actions, on a raised band. */
export function CtaSection({ headline, lead, actions, className }: CtaSectionProps) {
  return (
    <section data-slot="cta-section" className={cn("flex flex-col items-center gap-4 rounded-xl bg-surface-raised px-6 py-12 text-center shadow-elevation-1", className)}>
      <h2 className="text-title-1 text-balance">{headline}</h2>
      {lead ? <p className="max-w-prose text-body text-muted-foreground">{lead}</p> : null}
      <MarketingActions actions={actions} className="justify-center pt-2" />
    </section>
  );
}
