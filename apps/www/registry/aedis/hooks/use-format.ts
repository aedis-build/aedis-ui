"use client";

import * as React from "react";

import { useLocale } from "@/registry/aedis/lib/locale";

type DateInput = Date | string | number;

const toDate = (value: DateInput) => (value instanceof Date ? value : new Date(value));

// Largest unit first; the first one that fits the distance wins.
const units: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31_557_600],
  ["month", 2_629_800],
  ["week", 604_800],
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
  ["second", 1],
];

/** Date, number, currency and relative time in the provider locale, on the platform Intl APIs. */
function useFormat() {
  const { locale } = useLocale();
  return React.useMemo(
    () => ({
      date: (value: DateInput, options: Intl.DateTimeFormatOptions = { dateStyle: "medium" }) =>
        new Intl.DateTimeFormat(locale, options).format(toDate(value)),
      dateTime: (value: DateInput) => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(toDate(value)),
      number: (value: number, options?: Intl.NumberFormatOptions) => new Intl.NumberFormat(locale, options).format(value),
      /** ISO 4217 code, e.g. "BRL" or "USD". */
      currency: (value: number, currency: string) => new Intl.NumberFormat(locale, { style: "currency", currency }).format(value),
      /** "2 minutes ago", "in 3 days", "yesterday". */
      relative: (value: DateInput, now: DateInput = Date.now()) => {
        const seconds = (toDate(value).getTime() - toDate(now).getTime()) / 1000;
        const [unit, size] = units.find(([, s]) => Math.abs(seconds) >= s) ?? units[units.length - 1];
        return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(Math.round(seconds / size), unit);
      },
    }),
    [locale],
  );
}

export { useFormat };
