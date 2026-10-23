import { Citation, Sources } from "@/registry/aedis/ui/sources";

export default function SourcesDemo() {
  return (
    <div className="space-y-3 text-callout">
      <p>
        Shoot days are billed monthly<Citation n={1} idPrefix="example-sources" title="Pricing policy 2026" /> and delivered in 48 hours
        <Citation n={2} idPrefix="example-sources" title="Service levels" />.
      </p>
      <Sources
        idPrefix="example-sources"
        sources={[
          { title: "Pricing policy 2026", url: "https://www.example.com/docs/pricing", snippet: "Shoot days are billed monthly, in advance." },
          { title: "Service levels", url: "/docs/approval-card" },
        ]}
      />
    </div>
  );
}
