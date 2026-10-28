"use client";

import * as React from "react";

import { Button } from "@/registry/aedis/ui/button";
import { Field, FieldControl, FieldDescription, FieldError, FieldLabel, Form, Honeypot } from "@/registry/aedis/ui/field";
import { Textarea } from "@/registry/aedis/ui/textarea";

export default function FieldDemo() {
  const [sent, setSent] = React.useState("");
  return (
    <Form className="relative grid w-full max-w-sm gap-4" onFormSubmit={(values) => setSent(String(values.name))}>
      <Field name="name">
        <FieldLabel>Name</FieldLabel>
        <FieldControl required maxLength={80} autoComplete="name" />
        <FieldError>Tell us who to answer.</FieldError>
      </Field>
      <Field name="email">
        <FieldLabel>Email</FieldLabel>
        <FieldControl type="email" required maxLength={254} autoComplete="email" />
        <FieldDescription>We answer within one working day.</FieldDescription>
        <FieldError>Enter an email like name@studio.com.</FieldError>
      </Field>
      <Field name="project">
        <FieldLabel>Project</FieldLabel>
        <FieldControl render={<Textarea rows={3} maxLength={2000} />} required />
        <FieldError>Say a few words about the project.</FieldError>
      </Field>
      <Honeypot />
      <Button type="submit" className="justify-self-start">
        Send
      </Button>
      <p role="status" className="text-footnote text-muted-foreground">
        {sent ? `Thanks, ${sent}. This demo sends nothing.` : ""}
      </p>
    </Form>
  );
}
