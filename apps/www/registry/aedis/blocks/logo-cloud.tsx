import * as React from "react";

import { cn } from "@/lib/utils";
import { Link } from "@/registry/aedis/ui/link";

/** A client: its name always; a logo image on this origin (or one the CSP img-src allows) and a link when given. */
export type Client = { name: string; logo?: string; href?: string };

export type LogoCloudProps = { title: string; clients: Client[]; className?: string };

/** The clients a studio has worked with, as logos or names. Links go through the safe Link. */
export function LogoCloud({ title, clients, className }: LogoCloudProps) {
  const heading = React.useId();
  return (
    <section data-slot="logo-cloud" aria-labelledby={heading} className={cn("flex flex-col gap-6 px-6 py-10", className)}>
      <h2 id={heading} className="text-center text-footnote font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h2>
      <ul className="grid grid-cols-2 items-center gap-6 sm:grid-cols-3 lg:grid-cols-6">
        {clients.map((c) => {
          const mark = c.logo ? <img src={c.logo} alt={c.name} className="mx-auto h-8 w-auto object-contain opacity-80" /> : <span className="text-headline">{c.name}</span>;
          return (
            <li key={c.name} className="text-center text-muted-foreground">
              {c.href ? <Link href={c.href} className="text-current no-underline">{mark}</Link> : mark}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
