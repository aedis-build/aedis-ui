"use client";

import * as React from "react";

import { useFormat } from "@/registry/aedis/hooks/use-format";
import { en, LocaleProvider, type Messages } from "@/registry/aedis/lib/locale";
import { es } from "@/registry/aedis/lib/locales/es";
import { ptBR } from "@/registry/aedis/lib/locales/pt-br";
import { ApprovalCard } from "@/registry/aedis/ui/approval-card";
import { LocaleSwitcher } from "@/registry/aedis/ui/locale-switcher";

const dictionaries: Record<string, Messages> = { en, "pt-BR": ptBR, es };
const locales = [
  { code: "en", label: "English" },
  { code: "pt-BR", label: "Português" },
  { code: "es", label: "Español" },
];
const wait = () => new Promise<null>((r) => setTimeout(() => r(null), 500));

function Formatted() {
  const f = useFormat();
  const twoMinutesAgo = React.useMemo(() => new Date(Date.now() - 2 * 60_000), []);
  return (
    <ul className="text-callout text-muted-foreground">
      <li>{f.relative(twoMinutesAgo)}</li>
      <li>{f.currency(449, "BRL")}</li>
      <li>{f.number(250000)}</li>
    </ul>
  );
}

/** Docs example: the switcher drives the provider, and the card and formats follow. */
export default function LocaleSwitcherDemo() {
  const [locale, setLocale] = React.useState("pt-BR");
  return (
    <LocaleProvider locale={locale} messages={dictionaries[locale]}>
      <div className="flex max-w-md flex-col gap-3">
        <LocaleSwitcher locales={locales} onChange={setLocale} />
        <ApprovalCard requester="Rafael" content="**Proposal for Acme Bistro**" onApprove={wait} onRequestChanges={wait} />
        <Formatted />
      </div>
    </LocaleProvider>
  );
}
