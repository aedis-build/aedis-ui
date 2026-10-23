import NextLink from "next/link";
import type { ReactNode } from "react";

import { components } from "@/content/components";
import { Link } from "@/registry/aedis/ui/link";

const key = (s: string) => s.replace(/\(.*$/, "").replace(/[\s-]/g, "").toLowerCase();

// A name in backticks links to the page of the item that defends it.
const pages = new Map<string, string>([
  ...components.flatMap((c) => [[key(c.title), `/docs/${c.name}`] as const, [key(c.name), `/docs/${c.name}`] as const]),
  ["safeurl", "/docs/untrusted"],
  ["stripinvisible", "/docs/untrusted"],
  ["connecteventstream", "/docs/event-stream"],
  ["bffstream", "/docs/bff-stream"],
  ["secureaction", "/docs/secure-action"],
  ["csrfcookie", "/docs/api"],
  ["customtheme", "/themes"],
  ["@aedis/cli", "/docs"],
]);

/** One line of the security document: `code` (linked when it names an item), **bold** and [links](url), as text. */
export function InlineMarkdown({ text }: { text: string }) {
  const out: ReactNode[] = [];
  const pattern = /`([^`]+)`|\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  for (const m of text.matchAll(pattern)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const [, code, bold, label, href] = m;
    if (code !== undefined) {
      const page = pages.get(key(code));
      const el = <code className="font-mono text-[0.92em]">{code}</code>;
      out.push(page ? <NextLink key={m.index} href={page} className="focus-ring rounded-xs text-link underline-offset-4 hover:underline">{el}</NextLink> : <span key={m.index}>{el}</span>);
    } else if (bold !== undefined) out.push(<strong key={m.index} className="font-medium text-foreground">{bold}</strong>);
    else out.push(<Link key={m.index} href={href}>{label}</Link>);
    last = m.index + m[0].length;
  }
  out.push(text.slice(last));
  return <>{out}</>;
}
