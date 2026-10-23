import type { Metadata } from "next";

import { JsonLd } from "@/components/site/json-ld";
import { pageMetadata } from "@/content/share";
import { CodeBlock } from "@/registry/aedis/ui/code-block";

export const metadata: Metadata = pageMetadata("/docs/server-actions");

export default function ServerActions() {
  return (
    <article className="space-y-8">
      <JsonLd path="/docs/server-actions" />
      <header className="space-y-2">
        <h1 className="text-title-1">Server Actions</h1>
        <p className="text-body text-muted-foreground">
          A Server Action is a public POST endpoint. Anyone who finds its id can call it with any input, including actions that no screen
          calls anymore. The UI that hides a button is not a check. <code className="font-mono">secureAction</code> puts the checks inside the action.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-title-2">1. Wrap every action</h2>
        <CodeBlock
          lang="ts"
          title="app/agents/actions.ts"
          code={`"use server";

import { z } from "zod";
import { ActionError, secureAction } from "@/lib/secure-action";

export const renameAgent = secureAction({
  // Required, and it runs on every call.
  authorize: async () => {
    const user = await currentUser();
    if (user && !user.can("agents:write")) throw new ActionError("forbidden");
    return user; // null answers "unauthorized"
  },
  schema: z.object({ id: z.string().uuid(), name: z.string().min(1).max(80) }),
  maxInputBytes: 4 * 1024,
  rateLimit: (user) => limiter.take(\`rename:\${user.id}\`),
  handler: async ({ id, name }, user) => db.agents.rename(user.tenantId, id, name),
});`}
        />
        <ul className="list-disc space-y-1 pl-5 text-callout">
          <li>The order is fixed: authorize, rate limit, size limit, schema, handler. An anonymous call is never parsed.</li>
          <li>The handler only sees the schema&apos;s output, so extra fields never reach your database.</li>
          <li>Any schema library works through Standard Schema: zod, valibot, arktype and others.</li>
          <li>
            The client gets <code className="font-mono">{"{ ok: true, data }"}</code> or <code className="font-mono">{"{ ok: false, code }"}</code>; the error message stays in
            the server log. Map the code to your own text, or show <code className="font-mono">useToast().failed()</code>.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-title-2">2. Keep secrets on the server</h2>
        <ul className="list-disc space-y-1 pl-5 text-callout">
          <li>
            The file imports <code className="font-mono">server-only</code>: importing it from a Client Component fails the build.
          </li>
          <li>
            Never capture a secret in a closure inside a component (<code className="font-mono">{"async function save() { \"use server\"; use(token) }"}</code>): Next encrypts
            closed-over values, but they still travel to the browser and back. Read the secret inside the action.
          </li>
          <li>
            Turn on <code className="font-mono">experimental.taint</code> and call <code className="font-mono">taintSecret(message, lifetimeObject, token)</code> where you load a token:
            React then refuses to pass it to a Client Component. It returns false when the API is not available.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-title-2">3. Configure Next</h2>
        <CodeBlock
          lang="ts"
          title="next.config.ts"
          code={`const config: NextConfig = {
  experimental: {
    taint: true,
    serverActions: {
      // Requests whose Origin does not match the Host (or one of these) are rejected by Next.
      allowedOrigins: ["app.example.com"],
      // Default 1 MB; keep it close to what your largest form needs.
      bodySizeLimit: "256kb",
    },
  },
};`}
        />
        <ul className="list-disc space-y-1 pl-5 text-callout">
          <li>Next compares the Origin header with the Host on every action call and rejects a mismatch; behind a proxy, list the public origin in allowedOrigins rather than turning the check off.</li>
          <li>bodySizeLimit is the outer bound for the whole request; maxInputBytes in secureAction is the bound for each action.</li>
          <li>Delete actions you no longer use: an unused action is still reachable.</li>
        </ul>
      </section>
    </article>
  );
}
