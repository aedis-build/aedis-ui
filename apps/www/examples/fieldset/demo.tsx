import { Checkbox } from "@/registry/aedis/ui/checkbox";
import { Field, FieldLabel } from "@/registry/aedis/ui/field";
import { Fieldset, FieldsetLegend } from "@/registry/aedis/ui/fieldset";

const needs = ["Brand identity", "Website", "Photography"];

export default function FieldsetDemo() {
  return (
    <Fieldset>
      <FieldsetLegend>What do you need?</FieldsetLegend>
      {needs.map((need) => (
        <Field key={need}>
          <FieldLabel className="flex items-center gap-2">
            <Checkbox name="needs" value={need} />
            {need}
          </FieldLabel>
        </Field>
      ))}
    </Fieldset>
  );
}
