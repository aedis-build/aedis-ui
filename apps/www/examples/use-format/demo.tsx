"use client";

import * as React from "react";

import { useFormat } from "@/registry/aedis/hooks/use-format";
import { en, LocaleProvider } from "@/registry/aedis/lib/locale";
import { es } from "@/registry/aedis/lib/locales/es";
import { ptBR } from "@/registry/aedis/lib/locales/pt-br";
import { ToggleGroup, ToggleGroupItem } from "@/registry/aedis/ui/toggle-group";

const locales = { en, "pt-BR": ptBR, es };

function Invoice() {
  const f = useFormat();
  const due = new Date(2026, 9, 18);
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-callout">
      <dt className="text-muted-foreground">Amount</dt>
      <dd data-testid="amount">{f.currency(1260.5, "BRL")}</dd>
      <dt className="text-muted-foreground">Due</dt>
      <dd data-testid="due">{f.date(due)}</dd>
      <dt className="text-muted-foreground">Agents</dt>
      <dd>{f.number(12480)}</dd>
    </dl>
  );
}

/** The same invoice formatted by useFormat in the locale the provider gives it. */
export default function UseFormatDemo() {
  const [locale, setLocale] = React.useState(["pt-BR"]);
  const tag = locale[0] as keyof typeof locales;
  return (
    <div className="grid w-full max-w-sm gap-4">
      <ToggleGroup variant="segmented" aria-label="Locale" value={locale} onValueChange={setLocale}>
        {Object.keys(locales).map((l) => (
          <ToggleGroupItem key={l} value={l}>
            {l}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <LocaleProvider locale={tag} messages={locales[tag]}>
        <Invoice />
      </LocaleProvider>
    </div>
  );
}
