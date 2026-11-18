"use client";

import * as React from "react";

import { Logo } from "@/components/site/logo";
import { AuthSplit, AuthSplitDivider } from "@/registry/aedis/blocks/auth-split";
import { Button } from "@/registry/aedis/ui/button";
import { Field, FieldControl, FieldLabel } from "@/registry/aedis/ui/field";

const copy = {
  "sign-in": { title: "Sign in to Aedis", submit: "Continue with email", passkey: "Sign in with a passkey", ask: "New to Aedis?", other: "Create an account" },
  "sign-up": { title: "Create your Aedis account", submit: "Create account", passkey: "Sign up with a passkey", ask: "Already have an account?", other: "Sign in" },
};

/** Sign in and sign up on the same split screen. The backend is simulated: nothing leaves the browser. */
export default function AuthSplitDemo() {
  const [mode, setMode] = React.useState<keyof typeof copy>("sign-in");
  const [status, setStatus] = React.useState("");
  const c = copy[mode];
  const simulate = (what: string) => setStatus(`Simulated: ${what}. Nothing was sent.`);
  return (
    <AuthSplit
      mark={
        <span className="inline-flex items-center gap-2 text-headline">
          <Logo className="size-8" />
          Aedis
        </span>
      }
      statement="Every change to your systems, signed, reviewed and on record."
      shortStatement="Every change, signed and on record."
      facts={[
        { title: "Signed by default", detail: "Each release carries its provenance." },
        { title: "Reviewed by people", detail: "Agents propose; a person approves." },
        { title: "Kept on record", detail: "Every decision can be traced back." },
      ]}
      title={c.title}
      lead="Use your work email or a passkey."
      onSubmit={(e) => {
        e.preventDefault();
        simulate(mode === "sign-in" ? "a sign-in link would go to that address" : "an account would be created for that address");
      }}
      footer={
        <>
          <span>{c.ask}</span>
          <Button
            variant="link"
            type="button"
            className="h-auto px-0"
            onClick={() => {
              setMode(mode === "sign-in" ? "sign-up" : "sign-in");
              setStatus("");
            }}
          >
            {c.other}
          </Button>
          <a href="/security" className="ml-auto text-link underline underline-offset-4 focus-ring rounded-xs">
            How accounts are kept safe
          </a>
        </>
      }
    >
      <Button variant="outline" type="button" className="h-11" onClick={() => simulate("you would continue to Google")}>
        Continue with Google
      </Button>
      <AuthSplitDivider />
      <Field name="email">
        <FieldLabel>Work email</FieldLabel>
        <FieldControl type="email" required autoComplete="username webauthn" placeholder="you@company.com" className="h-11" />
      </Field>
      <Button type="submit" className="h-11">
        {c.submit}
      </Button>
      <Button variant="ghost" type="button" className="h-11" onClick={() => simulate("your device would ask for the passkey")}>
        {c.passkey}
      </Button>
      <p role="status" className="min-h-5 text-footnote text-muted-foreground">
        {status}
      </p>
    </AuthSplit>
  );
}
