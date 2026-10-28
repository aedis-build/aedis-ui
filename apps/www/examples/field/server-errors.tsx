import { Field, FieldControl, FieldError, FieldLabel } from "@/registry/aedis/ui/field";

/** What the server said: a failed secureAction result lists the invalid fields in `fields`. */
const result = { ok: false, code: "invalid", fields: ["email"] } as const;

export default function FieldServerErrors() {
  return (
    <div className="grid w-full max-w-sm gap-4">
      <Field name="email" errors={result.fields}>
        <FieldLabel>Email</FieldLabel>
        <FieldControl type="email" defaultValue="ana@studio.com" maxLength={254} />
        <FieldError>This email is already on the list.</FieldError>
      </Field>
    </div>
  );
}
