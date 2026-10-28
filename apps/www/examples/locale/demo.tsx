"use client";

import * as React from "react";

import { en, LocaleProvider } from "@/registry/aedis/lib/locale";
import { es } from "@/registry/aedis/lib/locales/es";
import { ptBR } from "@/registry/aedis/lib/locales/pt-br";
import { Combobox } from "@/registry/aedis/ui/combobox";
import { CopyButton } from "@/registry/aedis/ui/copy-button";
import { ToggleGroup, ToggleGroupItem } from "@/registry/aedis/ui/toggle-group";

const locales = { en, "pt-BR": ptBR, es };

/** Every word a component shows comes from the provider: switch the locale and the same components speak it. */
export default function LocaleDemo() {
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
        <div className="grid gap-3">
          <CopyButton value="https://rlfn.studio/p/ana" />
          <Combobox aria-label="Sector" options={[{ value: "bakery", label: "Bakery" }]} />
        </div>
      </LocaleProvider>
    </div>
  );
}
