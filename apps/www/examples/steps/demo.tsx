"use client";

import * as React from "react";

import { Button } from "@/registry/aedis/ui/button";
import { Input } from "@/registry/aedis/ui/input";
import { Label } from "@/registry/aedis/ui/label";
import { Step, Steps } from "@/registry/aedis/ui/steps";

const wizard = [
  { title: "Create the application", field: "Application name", type: "text", placeholder: "Aedis Console" },
  { title: "Add a redirect URI", field: "Redirect URI", type: "url", placeholder: "https://app.example.com/callback" },
  { title: "Add the JWKS credential", field: "JWKS URL", type: "url", placeholder: "https://app.example.com/.well-known/jwks.json" },
  { title: "Test the sign-in", field: "Test user email", type: "email", placeholder: "ana@example.com" },
];

// The Identity wizard: nothing leaves the page, Continue only moves to the next step.
export default function StepsDemo() {
  const [values, setValues] = React.useState(["Aedis Console", "", "", ""]);
  const [current, setCurrent] = React.useState(1);
  const done = React.useRef<HTMLParagraphElement>(null);
  React.useEffect(() => {
    if (current === wizard.length) done.current?.focus();
  }, [current]);
  return (
    <div className="grid w-full max-w-2xl gap-6">
      <h2 className="text-title-3 font-semibold">Connect your first application</h2>
      <Steps>
        {wizard.map((s, i) => {
          const id = `steps-demo-${i}`;
          return (
            <Step
              key={s.title}
              status={i < current ? "done" : i === current ? "current" : "upcoming"}
              title={s.title}
              summary={values[i]}
              action={
                <Button variant="link" size="sm" className="h-auto px-0 py-0" onClick={() => setCurrent(i)}>
                  Change{" "}<span className="sr-only">{s.title}</span>
                </Button>
              }
            >
              <form
                className="grid max-w-md gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  setCurrent(i + 1);
                }}
              >
                <Label htmlFor={id}>{s.field}</Label>
                <Input
                  id={id}
                  type={s.type}
                  required
                  placeholder={s.placeholder}
                  value={values[i]}
                  onChange={(e) => setValues((v) => v.map((x, j) => (j === i ? e.target.value : x)))}
                />
                <Button type="submit" className="w-fit">
                  {i === wizard.length - 1 ? "Finish" : "Continue"}
                </Button>
              </form>
            </Step>
          );
        })}
      </Steps>
      {/* Always in the page, so the live region exists before its text arrives; focus lands here once the form is gone. */}
      <p ref={done} role="status" tabIndex={-1} className="focus-ring rounded-xs text-callout text-muted-foreground empty:hidden">
        {current === wizard.length ? "All four steps are done." : null}
      </p>
    </div>
  );
}
