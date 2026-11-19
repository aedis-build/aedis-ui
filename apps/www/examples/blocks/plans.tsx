"use client";

import * as React from "react";

import { Plans, type Plan } from "@/registry/aedis/blocks/plans";
import { ToggleGroup, ToggleGroupItem } from "@/registry/aedis/ui/toggle-group";

// The Aedis console plans, in reais for Brazil and in dollars elsewhere. Switching plans is simulated in the browser.
const prices = {
  BRL: { locale: "pt-BR", start: 99, pro: 299, business: 990 },
  USD: { locale: "en-US", start: 19, pro: 59, business: 199 },
};

const tiers = [
  { id: "free", name: "Free", items: ["1 agent", "1,000 runs a month", "Community support"] },
  { id: "start", name: "Start", items: ["3 agents", "10,000 runs a month", "Email support"] },
  { id: "pro", name: "Pro", items: ["10 agents", "100,000 runs a month", "Approvals and audit log"] },
  { id: "business", name: "Business", items: ["Unlimited agents", "SSO and roles", "99.9% uptime"] },
  { id: "managed", name: "Managed", items: ["Run by our team", "Your cloud or ours", "Named engineer"] },
] as const;

export default function PlansDemo() {
  const [currency, setCurrency] = React.useState<"BRL" | "USD">("BRL");
  const [current, setCurrent] = React.useState("start");
  const [asked, setAsked] = React.useState(false);
  const label = React.useId();
  const p = prices[currency];
  const plans: Plan[] = tiers.map((t) => ({
    id: t.id,
    name: t.name,
    price: t.id === "free" ? 0 : t.id === "managed" ? "Talk to us" : p[t.id],
    period: t.id === "free" || t.id === "managed" ? undefined : "per month",
    items: [...t.items],
    action:
      t.id === current
        ? undefined
        : t.id === "managed"
          ? { label: "Talk to us about Managed", onClick: () => setAsked(true) }
          : { label: `Switch to ${t.name}`, onClick: () => setCurrent(t.id) },
  }));
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <p id={label} className="text-callout font-medium">
          Prices in
        </p>
        <ToggleGroup variant="outline" aria-labelledby={label} value={[currency]} onValueChange={(v) => v[0] && setCurrency(v[0] as "BRL" | "USD")}>
          <ToggleGroupItem value="BRL">BRL</ToggleGroupItem>
          <ToggleGroupItem value="USD">USD</ToggleGroupItem>
        </ToggleGroup>
        <p className="text-footnote text-muted-foreground">Switching plans here is simulated: nothing is charged.</p>
      </div>
      <Plans title="Plan and billing" plans={plans} current={current} currency={currency} locale={p.locale} />
      <p role="status" className="text-footnote text-muted-foreground">
        {asked ? "Simulated: here the console would open a message to our team about Managed." : null}
      </p>
    </div>
  );
}
