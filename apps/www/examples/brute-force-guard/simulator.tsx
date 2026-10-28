"use client";

import * as React from "react";

import { memoryCache } from "@/registry/aedis/lib/abuse-gate";
import { bruteForceGuard } from "@/registry/aedis/lib/brute-force-guard";
import { Button } from "@/registry/aedis/ui/button";
import { Input } from "@/registry/aedis/ui/input";
import { Label } from "@/registry/aedis/ui/label";

const SECRET = "demo-only-secret-0123456789-abcdefghij";
const MIN = 60_000;
const PASSWORD = "open sesame";

/** The real bruteForceGuard with a clock you can move: 3 wrong passwords lock for 1 min, then 15 min, then 1 h. */
export default function BruteForceGuardSimulator() {
  const clock = React.useRef(Date.now());
  const now = () => clock.current;
  const [guard] = React.useState(() => bruteForceGuard({ secret: SECRET, maxFailures: 3, now, cache: memoryCache({ now }) }));
  const [password, setPassword] = React.useState("");
  const [log, setLog] = React.useState<string[]>([]);
  const say = (line: string) => setLog((l) => [line, ...l].slice(0, 6));
  const who = ["ana@studio.com"];

  async function signIn() {
    const gate = await guard.check(who);
    if (!gate.ok) return say(`Locked. Try again in ${Math.ceil(gate.retryAfterMs / MIN)} min.`);
    if (password === PASSWORD) {
      await guard.succeed(who);
      return say("Signed in. Failures cleared.");
    }
    const { lockedForMs } = await guard.fail(who);
    say(lockedForMs ? `Wrong password. Locked for ${lockedForMs / MIN} min.` : "Wrong password.");
  }

  const wait = (min: number) => {
    clock.current += min * MIN;
    say(`${min} minutes later.`);
  };

  return (
    <div className="grid w-full max-w-md gap-4">
      <div className="grid gap-2">
        <Label htmlFor="bf-password">Password for ana@studio.com</Label>
        <Input id="bf-password" type="password" value={password} maxLength={64} onChange={(e) => setPassword(e.currentTarget.value)} />
        <p className="text-footnote text-muted-foreground">The right one is “{PASSWORD}”.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={signIn}>Sign in</Button>
        <Button variant="outline" onClick={() => wait(1)}>
          Wait 1 minute
        </Button>
        <Button variant="outline" onClick={() => wait(15)}>
          Wait 15 minutes
        </Button>
      </div>
      <div role="log" aria-label="Sign-in results">
        <ol className="grid gap-1 text-callout">
          {log.map((line, i) => (
            <li key={log.length - i}>{line}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}
