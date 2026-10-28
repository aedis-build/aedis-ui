"use client";

import * as React from "react";
import { Field as FieldPrimitive } from "@base-ui/react/field";
import { Form as FormPrimitive } from "@base-ui/react/form";

import { cn, type WithClassName } from "@/lib/utils";
import { useMessages, type Messages } from "@/registry/aedis/lib/locale";
import { Input } from "@/registry/aedis/ui/input";

/** True when the field is invalid because its caller says so (invalid, errors), not because of its own validation. */
const Forced = React.createContext(false);

type FieldProps = WithClassName<FieldPrimitive.Root.Props> & {
  /** The `fields` of a failed secureAction result: the field is invalid when its name is in the list. */
  errors?: readonly string[];
};

/**
 * One form field: its label, control, description and error are wired to each other (label for, aria-describedby,
 * aria-invalid). It validates when the control loses focus, so a mistake shows before the form is sent.
 */
function Field({ className, errors, name, invalid, validationMode = "onBlur", ...props }: FieldProps) {
  const forced = Boolean(invalid || (name !== undefined && errors?.includes(name)));
  return (
    <Forced.Provider value={forced}>
      <FieldPrimitive.Root
        data-slot="field"
        name={name}
        invalid={forced || undefined}
        validationMode={validationMode}
        className={cn("flex flex-col gap-2", className)}
        {...props}
      />
    </Forced.Provider>
  );
}

function FieldLabel({ className, ...props }: WithClassName<FieldPrimitive.Label.Props>) {
  return (
    <FieldPrimitive.Label
      data-slot="field-label"
      className={cn("text-callout font-medium leading-none select-none data-disabled:cursor-not-allowed data-disabled:opacity-50", className)}
      {...props}
    />
  );
}

/** The field's control; an Input unless `render` says otherwise (e.g. render={<Textarea />}). */
function FieldControl({ render = <Input />, ...props }: FieldPrimitive.Control.Props) {
  return <FieldPrimitive.Control data-slot="field-control" render={render} {...props} />;
}

function FieldDescription({ className, ...props }: WithClassName<FieldPrimitive.Description.Props>) {
  return <FieldPrimitive.Description data-slot="field-description" className={cn("text-footnote text-muted-foreground", className)} {...props} />;
}

/**
 * Shown while the field is invalid; with no children it shows the browser's own message. It renders inside a live
 * region that is always there, so a screen reader announces the error when it appears.
 */
function FieldError({ className, match, ...props }: WithClassName<FieldPrimitive.Error.Props>) {
  const forced = React.useContext(Forced);
  return (
    <div aria-live="polite" data-slot="field-error-region">
      <FieldPrimitive.Error data-slot="field-error" match={forced || match} className={cn("text-footnote text-destructive", className)} {...props} />
    </div>
  );
}

/** A form that checks every field on submit, shows their errors and focuses the first invalid one before onFormSubmit runs. */
function Form({ className, ...props }: WithClassName<FormPrimitive.Props>) {
  return <FormPrimitive data-slot="form" className={className} {...props} />;
}

type HoneypotProps = { name?: string; labels?: Partial<Pick<Messages["field"], "honeypot">> };

/**
 * A spam trap: a text field people never see, hear or reach with the keyboard, which form-filling bots fill in. The
 * server rejects a submit whose honeypot is not empty.
 */
function Honeypot({ name = "website", labels }: HoneypotProps) {
  const l = useMessages("field", labels);
  const id = React.useId();
  return (
    <div aria-hidden="true" data-slot="honeypot" className="absolute top-auto -left-[10000px] size-px overflow-hidden">
      <label htmlFor={id}>{l.honeypot}</label>
      <input id={id} name={name} type="text" tabIndex={-1} autoComplete="off" maxLength={256} defaultValue="" />
    </div>
  );
}

export { Field, FieldControl, FieldDescription, FieldError, FieldLabel, Form, Honeypot };
