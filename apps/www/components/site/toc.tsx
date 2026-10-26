"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/** "On this page": links to the page's sections; the one being read is marked. */
export function Toc({ items }: { items: { id: string; title: string }[] }) {
  const [active, setActive] = React.useState(items[0]?.id);
  // The entry clicked stays marked while its heading is on screen, even if the page cannot scroll it to the top.
  const pinned = React.useRef<string | null>(null);

  React.useEffect(() => {
    // The section being read is the last one whose heading has passed below the header; at the very end of the page
    // it is the last one, which may be too short to ever reach the top.
    const update = () => {
      const clicked = pinned.current && document.getElementById(pinned.current)?.getBoundingClientRect();
      if (clicked && clicked.top >= 0 && clicked.top < innerHeight) return;
      pinned.current = null;
      const sections = items.map((i) => document.getElementById(i.id)).filter((el): el is HTMLElement => el !== null);
      if (!sections.length) return;
      const end = innerHeight + scrollY >= document.documentElement.scrollHeight - 2;
      const passed = sections.filter((el) => el.getBoundingClientRect().top <= 96);
      setActive((end ? sections.at(-1) : (passed.at(-1) ?? sections[0]))!.id);
    };
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
    };
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
              // What was clicked is what is being read, even when the page cannot scroll it to the top.
              onClick={() => {
                pinned.current = i.id;
                setActive(i.id);
              }}
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
