"use client";

import * as React from "react";

import { Combobox } from "@/registry/aedis/ui/combobox";
import { Field, FieldDescription, FieldLabel } from "@/registry/aedis/ui/field";

const sectors = ["Architecture", "Bakery", "Ceramics", "Education", "Fashion", "Furniture", "Hotels", "Music", "Restaurants", "Wine"].map((label) => ({
  value: label.toLowerCase(),
  label,
}));

export default function ComboboxDemo() {
  const [value, setValue] = React.useState<string | null>(null);
  return (
    <Field name="sector" className="w-full max-w-xs">
      <FieldLabel>Sector</FieldLabel>
      <Combobox options={sectors} placeholder="Type to filter" value={value} onValueChange={setValue} />
      <FieldDescription>{value ? `Sends sector=${value}.` : "Type a few letters, then pick with the arrows and Enter."}</FieldDescription>
    </Field>
  );
}
