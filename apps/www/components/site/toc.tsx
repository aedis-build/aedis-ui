"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/** "On this page": links to the page's sections; the one being read is marked. */
export function Toc({ items }: { items: { id: string; title: string }[] }) {
  const [active, setActive] = React.useState(items[0]?.id);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-80px 0px -60% 0px" },
    );
    for (const { id } of items) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav aria-label="On this page" className="space-y-2 text-footnote">
      <p className="font-medium text-foreground">On this page</p>
      <ul className="space-y-1.5">
        {items.map((i) => (
          <li key={i.id}>
            <a
              href={`#${i.id}`}
              aria-current={active === i.id ? "location" : undefined}
              className={cn("focus-ring rounded-xs text-muted-foreground transition-colors duration-(--duration-fast) ease-out hover:text-foreground", "aria-[current=location]:font-medium aria-[current=location]:text-link")}
            >
              {i.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
