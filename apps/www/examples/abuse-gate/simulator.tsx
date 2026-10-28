"use client";

import * as React from "react";

import { abuseGate, hmacKey, memoryCache } from "@/registry/aedis/lib/abuse-gate";
import { Button } from "@/registry/aedis/ui/button";
import { Input } from "@/registry/aedis/ui/input";
import { Label } from "@/registry/aedis/ui/label";

// A demo secret: in an app it comes from the server's secrets and never reaches the browser.
const SECRET = "demo-only-secret-0123456789-abcdefghij";
const MIN = 60_000;

/** The real abuseGate in the browser, with a clock you can move: 3 submits per contact in 10 minutes, 5 per IP. */
export default function AbuseGateSimulator() {
  const clock = React.useRef(Date.now());
  const now = () => clock.current;
  const [gate] = React.useState(() => abuseGate({ secret: SECRET, limit: 3, windowMs: 10 * MIN, ipLimit: 5, now, cache: memoryCache({ now }) }));
  const [email, setEmail] = React.useState("ana@studio.com");
  const [company, setCompany] = React.useState("Ceramics Studio");
  const [ip, setIp] = React.useState("203.0.113.7");
  const [log, setLog] = React.useState<string[]>([]);
  const [key, setKey] = React.useState("");
  const say = (line: string) => setLog((l) => [line, ...l].slice(0, 6));

  async function submit() {
    const r = await gate.check({ target: [email, company], ip });
    setKey(await hmacKey(SECRET, "target", [email, company]));
    say(r.ok ? "Accepted." : `Refused: too many for this ${r.reason === "ip" ? "IP" : "contact"}. Retry in ${Math.ceil(r.retryAfterMs / MIN)} min.`);
  }

  return (
    <div className="grid w-full max-w-xl gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {(
          [
            ["Email", email, setEmail],
            ["Company", company, setCompany],
            ["IP", ip, setIp],
          ] as const
        ).map(([label, value, set]) => (
          <div key={label} className="grid gap-2">
            <Label htmlFor={`gate-${label}`}>{label}</Label>
            <Input id={`gate-${label}`} value={value} maxLength={120} onChange={(e) => set(e.currentTarget.value)} />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={submit}>Submit</Button>
        <Button variant="outline" onClick={() => (clock.current += 5 * MIN, say("5 minutes later."))}>
          Wait 5 minutes
        </Button>
      </div>
      <p className="font-mono text-footnote break-all text-muted-foreground">Stored key: {key || "nothing yet"}</p>
      <div role="log" aria-label="Gate results">
        <ol className="grid gap-1 text-callout">
          {log.map((line, i) => (
            <li key={log.length - i}>{line}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}
