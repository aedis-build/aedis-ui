"use client";

import Link from "next/link";
import * as React from "react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export type NavGroup = { title: string; items: { href: string; title: string }[] };

/** The docs navigation by category, with the current page marked. Shared by the sidebar and the phone sheet. */
export function DocsNav({ groups, onNavigate }: { groups: NavGroup[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  const nav = React.useRef<HTMLElement>(null);

  // The current page can sit far down a long list: bring it into the list's own view, never scrolling the page.
  React.useEffect(() => {
    const current = nav.current?.querySelector<HTMLElement>("[aria-current=page]");
    let box = nav.current?.parentElement;
    while (box && !(box.scrollHeight > box.clientHeight && /auto|scroll/.test(getComputedStyle(box).overflowY))) box = box.parentElement;
    if (!current || !box || box === document.documentElement || box === document.body) return;
    const offset = current.getBoundingClientRect().top - box.getBoundingClientRect().top;
    if (offset < 0 || offset > box.clientHeight - current.offsetHeight) box.scrollTop += offset - box.clientHeight / 3;
  }, [pathname]);

  return (
    <nav ref={nav} aria-label="Docs" className="space-y-5 text-callout">
      {groups.map((g) => (
        <div key={g.title}>
          <p className="mb-1 px-2.5 text-caption font-medium text-muted-foreground">{g.title}</p>
          <ul className="space-y-0.5">
            {g.items.map((i) => {
              // A route-handler file (llms.txt), not a page: a Link would prefetch and route it as one.
              const Item: React.ElementType = i.href.endsWith(".txt") ? "a" : Link;
              return (
              <li key={i.href}>
                <Item
                  href={i.href}
                  onClick={onNavigate}
                  aria-current={pathname === i.href ? "page" : undefined}
                  className={cn(
                    "focus-ring block rounded-sm px-2.5 py-1 text-muted-foreground transition-colors duration-(--duration-fast) ease-out hover:text-foreground",
                    "aria-[current=page]:bg-accent-soft aria-[current=page]:font-medium aria-[current=page]:text-foreground",
                  )}
                >
                  {i.title}
                </Item>
              </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
