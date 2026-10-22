import type { Metadata } from "next";
import Link from "next/link";

import { CLI, InstallCommand, RegistrySetup, ThemeImport } from "@/components/site/install-command";
import { Kbd } from "@/registry/aedis/ui/kbd";

export const metadata: Metadata = { title: "Introduction", description: "What Aedis UI is and how to install it with the Aedis CLI." };

const link = "focus-ring rounded-xs underline underline-offset-4";

export default function Introduction() {
  return (
    <article className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-title-1">Introduction</h1>
        <p className="text-body text-muted-foreground">
          Secure-by-default React components for building AI platforms: agent chat, approvals, hand raises, usage ceilings and the app shell
          around them. Like shadcn/ui, they are not a dependency: you add their source to your app and own it.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-title-2">Installation</h2>
        <p className="text-callout text-muted-foreground">
          Once per app, run <code className="font-mono">init</code>. It writes <code className="font-mono">aedis.json</code> (the pinned release and where files go), the
          theme, <code className="font-mono">cn</code> and the security primitives. The CLI verifies the signed registry release before writing any file,
          installs npm dependencies at exact versions at least 7 days old and runs no install scripts.
        </p>
        <RegistrySetup />
        <p className="text-callout text-muted-foreground">Import the theme once in your global CSS, after Tailwind:</p>
        <ThemeImport />
        <p className="text-callout text-muted-foreground">Then add components; their registry dependencies come with them:</p>
        <InstallCommand name="button" />
        <p className="text-callout text-muted-foreground">
          Never run <code className="font-mono">npx aedis</code>: the unscoped package belongs to someone else. The CLI is{" "}
          <code className="font-mono">{CLI.replace(/@[\d.]+$/, "")}</code>.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-title-2">Security by construction</h2>
        <p className="text-callout text-muted-foreground">
          There is no &quot;sanitize everything&quot; layer. A UI owns four sinks, and each component defends the one it touches: what is shown (DOM),
          what is sent to the backend (Transport), what the browser keeps (Session) and what people type (Input). Content comes in as props and
          renders as data; no prop accepts markup.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-title-2">Next</h2>
        <ul className="list-disc space-y-1 pl-5 text-callout">
          <li>Browse the components in the sidebar, or press <Kbd>⌘K</Kbd> to search.</li>
          <li><Link href="/docs/theming" className={link}>Theming</Link>: the tokens every component uses.</li>
          <li><Link href="/themes" className={link}>Themes</Link>: make your own theme and import it with the CLI.</li>
          <li><Link href="/docs/server-actions" className={link}>Server Actions</Link>: keep every action safe with <code className="font-mono">secureAction</code>.</li>
        </ul>
      </section>
    </article>
  );
}
