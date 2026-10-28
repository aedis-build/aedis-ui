import { cn } from "@/lib/utils";

/** A short fact: what it is, an optional numeral that leads it ("12", "98%"), and a line of detail. */
export type Proof = { label: string; value?: string; detail?: string };

export type ProofListProps = { title?: string; items: Proof[]; className?: string };

/** Short facts with optional numerals, as a description list: each label is the term, its numeral and detail the description. */
export function ProofList({ title, items, className }: ProofListProps) {
  return (
    <section data-slot="proof-list" className={cn("flex flex-col gap-6 px-6 py-10", className)}>
      {title ? <h2 className="text-title-2">{title}</h2> : null}
      <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((p) => (
          <div key={p.label} className="flex flex-col gap-1 border-t border-hairline pt-4">
            <dt className="text-callout font-medium">{p.label}</dt>
            {/* The numeral leads visually; the term still comes first for assistive technology. */}
            {p.value ? <dd className="order-first text-title-1 tabular-nums">{p.value}</dd> : null}
            {p.detail ? <dd className="text-footnote text-muted-foreground">{p.detail}</dd> : null}
          </div>
        ))}
      </dl>
    </section>
  );
}
