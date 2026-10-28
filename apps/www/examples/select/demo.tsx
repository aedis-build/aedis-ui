"use client";

import * as React from "react";

import { Field, FieldDescription, FieldLabel } from "@/registry/aedis/ui/field";
import { Select } from "@/registry/aedis/ui/select";

const proposals = [
  {
    label: "Open",
    options: [
      { value: "p-12", label: "Ceramics studio identity" },
      { value: "p-14", label: "Bakery website" },
    ],
  },
  { label: "Closed", options: [{ value: "p-03", label: "Gallery catalogue", disabled: true }] },
];

export default function SelectDemo() {
  const [value, setValue] = React.useState<string | null>(null);
  return (
    <Field name="proposal" className="w-full max-w-xs">
      <FieldLabel>Proposal</FieldLabel>
      <Select options={proposals} placeholder="Choose a proposal" value={value} onValueChange={setValue} />
      <FieldDescription>{value ? `The portfolio goes with ${value}.` : "Closed proposals cannot take a portfolio."}</FieldDescription>
    </Field>
  );
}
