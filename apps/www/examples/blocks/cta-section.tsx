import { CtaSection } from "@/registry/aedis/blocks/cta-section";

export default function CtaSectionDemo() {
  return (
    <div className="p-6">
      <CtaSection
        headline="Have a project in mind?"
        lead="Tell us about it. We answer within one working day."
        actions={[
          { label: "Start a project", href: "/docs/field" },
          { label: "Email us", href: "mailto:hello@rlfn.studio", variant: "outline" },
          { label: "Hidden", href: "javascript:alert(1)" },
        ]}
      />
    </div>
  );
}
