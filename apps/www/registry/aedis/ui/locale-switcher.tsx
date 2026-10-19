"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useLocale, useMessages } from "@/registry/aedis/lib/locale";

export type LocaleOption = {
  /** BCP 47 tag, e.g. "pt-BR". */
  code: string;
  /** Name in its own language, e.g. "Português". */
  label: string;
};

export type LocaleSwitcherProps = {
  locales: LocaleOption[];
  /** Selected locale. Defaults to the provider locale. */
  value?: string;
  /** The app stores the choice (cookie, profile) and re-renders the provider. */
  onChange: (code: string) => void;
  /** Accessible name. Defaults to the dictionary. */
  label?: string;
  className?: string;
};

/** Language picker. Each option is announced in its own language. */
function LocaleSwitcher({ locales, value, onChange, label, className }: LocaleSwitcherProps) {
  const { locale } = useLocale();
  const t = useMessages("localeSwitcher", label ? { label } : undefined);
  const id = React.useId();

  return (
    <div data-slot="locale-switcher" className={cn("inline-flex items-center", className)}>
      <label htmlFor={id} className="sr-only">
        {t.label}
      </label>
      <select
        id={id}
        value={value ?? locale}
        onChange={(e) => onChange(e.target.value)}
        className="focus-ring h-9 rounded-sm border border-border-control bg-surface px-2 text-callout"
      >
        {locales.map((option) => (
          <option key={option.code} value={option.code} lang={option.code}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export { LocaleSwitcher };
