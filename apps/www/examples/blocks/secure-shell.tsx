"use client";

import * as React from "react";

import { SecureShell, type SessionState } from "@/registry/aedis/blocks/secure-shell";
import { Button } from "@/registry/aedis/ui/button";
import { Sidebar } from "@/registry/aedis/ui/sidebar";

/** Docs example without a backend: the buttons stand in for the server ending the session. */
export default function SecureShellDemo() {
  const [session, setSession] = React.useState<SessionState>("active");
  return (
    <div className="h-96 w-full overflow-hidden rounded-xl border border-border">
      <SecureShell
        className="h-full min-h-0"
        title="Approvals"
        session={session}
        idleMinutes={15}
        onIdle={() => setSession("idle")}
        signInHref="#sign-in"
        sidebar={
          <Sidebar
            className="w-56"
            header={<span className="px-2 font-semibold">Acme Studio</span>}
            groups={[{ label: "Work", items: [{ href: "#approvals", label: "Approvals", count: 3, countLabel: "3 waiting", active: true }] }]}
            footer={<span className="px-2">Jordan · CEO</span>}
          />
        }
      >
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setSession("idle")}>Simulate 15 idle minutes</Button>
          <Button variant="outline" onClick={() => setSession("expired")}>Simulate a revoked session</Button>
        </div>
      </SecureShell>
      {session !== "active" ? (
        <div className="flex justify-center pb-4">
          <Button variant="ghost" onClick={() => setSession("active")}>Reset the demo</Button>
        </div>
      ) : null}
    </div>
  );
}
