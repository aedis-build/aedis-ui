"use client";

import * as React from "react";

import { issueFormToken, verifyFormToken } from "@/registry/aedis/lib/form-token";
import { Button } from "@/registry/aedis/ui/button";

const SECRET = "demo-only-secret-0123456789-abcdefghij";
const reasons = { malformed: "Refused: not a token.", signature: "Refused: the signature does not match.", "too-fast": "Refused: sent faster than a person can fill a form.", expired: "Refused: the form is over an hour old." };

/** Signs a form when it renders and checks the submit, with a clock you can move. */
export default function FormTokenSimulator() {
  const clock = React.useRef(Date.now());
  const [token, setToken] = React.useState("");
  const [log, setLog] = React.useState<string[]>([]);
  const say = (line: string) => setLog((l) => [line, ...l].slice(0, 6));

  async function render() {
    setToken(await issueFormToken(SECRET, { form: "contact", now: clock.current }));
    say("Form rendered with a fresh token.");
  }
  async function send(value = token) {
    const r = await verifyFormToken(SECRET, value, { form: "contact", now: clock.current });
    say(r.ok ? `Accepted, ${Math.round(r.ageMs / 1000)} s after rendering.` : reasons[r.reason]);
  }
  const wait = (ms: number, label: string) => {
    clock.current += ms;
    say(`${label} later.`);
  };

  return (
    <div className="grid w-full max-w-xl gap-4">
      <div className="flex flex-wrap gap-2">
        <Button onClick={render}>Render form</Button>
        <Button variant="outline" onClick={() => send()} disabled={!token}>
          Send
        </Button>
        <Button variant="outline" onClick={() => wait(5_000, "5 seconds")}>
          Wait 5 seconds
        </Button>
        <Button variant="outline" onClick={() => wait(60 * 60_000, "1 hour")}>
          Wait 1 hour
        </Button>
        <Button variant="outline" onClick={() => send(token.replace(/\.(\d)/, (_m, d) => `.${(Number(d) + 1) % 10}`))} disabled={!token}>
          Send with a forged time
        </Button>
      </div>
      <p className="font-mono text-footnote break-all text-muted-foreground">Hidden field: {token || "nothing yet"}</p>
      <div role="log" aria-label="Submit results">
        <ol className="grid gap-1 text-callout">
          {log.map((line, i) => (
            <li key={log.length - i}>{line}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}
