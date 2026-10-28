"use client";

import * as React from "react";

import { useDemoBackend } from "@/components/site/demo-backend";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/registry/aedis/ui/button";

/** api() against a backend simulated in the page: what it sends, and how it reads each answer. */
export default function ApiSimulator() {
  const [log, setLog] = React.useState<string[]>([]);
  const say = (line: string) => setLog((l) => [line, ...l].slice(0, 6));

  useDemoBackend((req) => {
    const path = new URL(req.url).pathname;
    if (!path.startsWith("/demo-api/")) return;
    say(`Server got ${req.method} ${path} · X-Requested-With: ${req.headers.get("x-requested-with")}${req.headers.get("x-csrf-token") ? ` · X-CSRF-Token: ${req.headers.get("x-csrf-token")}` : ""}`);
    if (path === "/demo-api/approvals") return Response.json([{ id: 42, title: "Send the October report" }]);
    if (path === "/demo-api/approvals/42/approve") return new Response(null, { status: 204 });
    if (path === "/demo-api/html") return new Response("<h1>Login</h1>", { headers: { "content-type": "text/html" } });
    return new Response(null, { status: 403 });
  });

  async function run(label: string, call: () => Promise<unknown>) {
    try {
      const data = await call();
      say(`${label}: ${data === undefined ? "done, no content" : JSON.stringify(data)}`);
    } catch (e) {
      say(`${label}: ${e instanceof ApiError ? `ApiError ${e.status} (${e.message})` : String(e)}`);
    }
  }

  return (
    <div className="grid w-full max-w-xl gap-4">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => run("Load", () => api("/demo-api/approvals"))}>Load approvals</Button>
        <Button
          variant="outline"
          onClick={() => {
            document.cookie = "XSRF-TOKEN=demo-7f3a; path=/; SameSite=Strict";
            return run("Approve", () => api("/demo-api/approvals/42/approve", { body: {}, csrfCookie: "XSRF-TOKEN" }));
          }}
        >
          Approve #42
        </Button>
        <Button variant="outline" onClick={() => run("Admin", () => api("/demo-api/admin"))}>
          Open admin
        </Button>
        <Button variant="outline" onClick={() => run("HTML", () => api("/demo-api/html"))}>
          Get a login page
        </Button>
      </div>
      <div role="log" aria-label="Requests">
        <ol className="grid gap-1 font-mono text-footnote break-words">
          {log.map((line, i) => (
            <li key={log.length - i}>{line}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}
