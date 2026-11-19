"use client";

import * as React from "react";

import { Fieldset, FieldsetLegend } from "@/registry/aedis/ui/fieldset";
import { RadioGroup, RadioGroupItem } from "@/registry/aedis/ui/radio-group";

const icon = (d: string) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const products = [
  { value: "identity", title: "Identity", description: "Sign-in, sessions and tokens for your users.", icon: icon("M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0") },
  { value: "compliance", title: "Compliance", description: "Consent, retention and audit evidence.", icon: icon("M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6l-7-3Zm-3 9 2 2 4-4") },
  { value: "residency", title: "Dedicated region", description: "Your data kept in one region you choose.", icon: icon("M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11Zm0-9a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"), contracted: true },
  { value: "keys", title: "Managed keys", description: "Encryption keys held in your own vault.", icon: icon("M15 7a4 4 0 1 1-3.5 6L4 20.5V17h3v-3h3l1.5-1.5A4 4 0 0 1 15 7Z"), contracted: true },
];

const appTypes = [
  { value: "server", title: "Server app", description: "A backend that keeps its own secret.", icon: icon("M4 5h16v6H4zM4 13h16v6H4zM8 8h.01M8 16h.01") },
  { value: "spa", title: "SPA or mobile", description: "Signs in through your backend; no secret in the client.", icon: icon("M7 3h10v18H7zM11 18h2") },
  { value: "agent", title: "AI agent", description: "Acts for a person with scoped, short-lived tokens.", icon: icon("M12 3v3m-6 3h12v10H6zM9 13h.01M15 13h.01M10 16h4") },
];

export default function RadioGroupCards() {
  const [product, setProduct] = React.useState("identity");
  const [appType, setAppType] = React.useState("server");
  return (
    <div className="flex w-full flex-col gap-8">
      <Fieldset render={<RadioGroup value={product} onValueChange={(v) => setProduct(v as string)} />} className="grid gap-3 sm:grid-cols-2">
        <FieldsetLegend className="mb-1 sm:col-span-2">Product</FieldsetLegend>
        {products.map((p) => (
          <RadioGroupItem key={p.value} variant="card" value={p.value} icon={p.icon} title={p.title} description={p.description} disabled={p.contracted}>
            {p.contracted ? "Contracted with our team" : null}
          </RadioGroupItem>
        ))}
      </Fieldset>
      <Fieldset render={<RadioGroup value={appType} onValueChange={(v) => setAppType(v as string)} />}>
        <FieldsetLegend className="mb-1">Application type</FieldsetLegend>
        {appTypes.map((a) => (
          <RadioGroupItem key={a.value} variant="card" value={a.value} icon={a.icon} title={a.title} description={a.description} />
        ))}
      </Fieldset>
      <p data-testid="radio-cards-summary" className="text-footnote text-muted-foreground">
        Selected: {products.find((p) => p.value === product)?.title}, {appTypes.find((a) => a.value === appType)?.title}.
      </p>
    </div>
  );
}
