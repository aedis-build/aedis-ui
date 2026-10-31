"use client";

import * as React from "react";

import { useMessages, type Messages } from "@/registry/aedis/lib/locale";
import { safeUrl } from "@/lib/untrusted";
import { watchScroll } from "@/registry/aedis/ui/scroll-motion";
import { cn } from "@/lib/utils";

export type DockSection = { id: string; label: string };

type SectionDockProps = {
  /** The page's sections in order, or "auto" to read every element with an id and a data-chapter label. */
  sections?: DockSection[] | "auto" | undefined;
  /** One primary action below the sections, e.g. a contact link. */
  action?: { label: string; href: string } | undefined;
  placement?: "bottom-right" | "bottom-left" | undefined;
  /** The reading point, as a share of the viewport height: the current section is the last one that starts above it. */
  head?: number | undefined;
  labels?: Partial<Messages["sectionDock"]> | undefined;
  className?: string | undefined;
};

// The whole document from its top at the top to its bottom at the bottom: the page's progress.
const PAGE = { start: ["contain", 0], end: ["contain", 100] } as const;

/**
 * A small ring that fills with the page's progress and opens, on hover, focus or tap, into the page's sections (read,
 * current, next) and one action. The current section is read from document position on scroll, not from
 * intersection, so a sticky scene that stays in view does not hold the title. Closed, the panel is not rendered.
 */
function SectionDock({ sections = "auto", action, placement = "bottom-right", head = 0.5, labels, className }: SectionDockProps) {
  const l = useMessages("sectionDock", labels);
  const [list, setList] = React.useState<DockSection[]>(sections === "auto" ? [] : sections);
  const [current, setCurrent] = React.useState(-1);
  const [hovered, setHovered] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const [tapped, setTapped] = React.useState(false);
  // Escape closes it until the focus leaves the dock or the ring is pressed again.
  const [dismissed, setDismissed] = React.useState(false);
  const ring = React.useRef<SVGCircleElement>(null);
  const button = React.useRef<HTMLButtonElement>(null);
  const id = React.useId();
  const open = !dismissed && (hovered || focused || tapped);
  // Following a link closes it and hands the focus to the section the link points to.
  const close = () => {
    setTapped(false);
    setHovered(false);
    setFocused(false);
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  };

  React.useEffect(() => {
    if (sections !== "auto") return setList(sections);
    setList([...document.querySelectorAll<HTMLElement>("[data-chapter][id]")].map((el) => ({ id: el.id, label: el.dataset.chapter || el.id })));
  }, [sections]);

  React.useEffect(() => {
    const page = document.documentElement;
    return watchScroll(page, PAGE, (progress) => {
      ring.current?.style.setProperty("stroke-dashoffset", String(1 - progress));
      const line = window.scrollY + head * window.innerHeight;
      let at = -1;
      list.forEach((s, i) => {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top + window.scrollY <= line) at = i;
      });
      setCurrent(at);
    });
  }, [list, head]);

  const here = list[current]?.label;
  const href = action ? safeUrl(action.href) : undefined;
  return (
    <nav
      aria-label={l.label}
      data-slot="section-dock"
      className={cn("fixed bottom-3 z-40 flex flex-col gap-2", placement === "bottom-right" ? "right-3 items-end" : "left-3 items-start", className)}
      onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
      onPointerLeave={() => {
        setHovered(false);
        setDismissed(false);
      }}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (e.currentTarget.contains(e.relatedTarget)) return;
        setFocused(false);
        setDismissed(false);
      }}
      onKeyDown={(e) => {
        if (e.key !== "Escape" || !open) return;
        setDismissed(true);
        setTapped(false);
        button.current?.focus();
      }}
    >
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-label={here ? l.ring.replace("{section}", here) : l.label}
        onClick={() => {
          setDismissed(false);
          setTapped((t) => !t);
        }}
        className="press focus-ring grid size-11 place-items-center rounded-full bg-surface-raised shadow-elevation-2"
      >
        <svg viewBox="0 0 36 36" aria-hidden="true" className="size-8 -rotate-90">
          <circle cx="18" cy="18" r="15" fill="none" strokeWidth="3" className="stroke-border" />
          <circle ref={ring} data-slot="section-dock-ring" cx="18" cy="18" r="15" fill="none" strokeWidth="3" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset="1" className="stroke-accent" />
        </svg>
      </button>
      {/* After the ring in the DOM, so Tab goes from the ring into the sections; order-first draws it above. */}
      {open ? (
        <div
          id={id}
          data-slot="section-dock-panel"
          className={cn(
            "order-first w-72 max-w-[calc(100vw-1.5rem)] rounded-md border border-hairline bg-surface-raised p-4 shadow-elevation-2",
            "origin-bottom transition-[opacity,scale] duration-(--duration-fast) ease-(--ease-out) starting:scale-95 starting:opacity-0 motion-reduce:transition-none",
            placement === "bottom-left" && "origin-bottom-left",
          )}
        >
          <ol className="relative grid gap-3">
            {list.map((s, i) => {
              const state = i < current ? "done" : i === current ? "current" : "next";
              return (
                <li key={s.id} data-state={state} className="relative grid grid-cols-[1.25rem_1fr] items-center gap-3">
                  {i < list.length - 1 ? (
                    <span aria-hidden="true" className={cn("absolute top-5 left-2.5 h-3 w-px -translate-x-1/2", i < current ? "bg-accent" : "bg-border")} />
                  ) : null}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "grid size-5 place-items-center rounded-full border-2 [&_svg]:size-3",
                      state === "done" && "border-accent bg-accent text-accent-foreground",
                      state === "current" && "border-accent text-accent",
                      state === "next" && "border-border-control text-muted-foreground",
                    )}
                  >
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {state === "done" ? <path d="M3.5 8.5l3 3 6-7" /> : <path d="M8 4.5V8l2.5 1.5" />}
                    </svg>
                  </span>
                  <a
                    href={`#${s.id}`}
                    aria-current={state === "current" ? "location" : undefined}
                    aria-label={`${s.label}, ${l[state]}`}
                    onClick={close}
                    className={cn("focus-ring rounded-xs text-callout", state === "next" ? "text-muted-foreground" : "text-foreground", state === "current" && "font-medium")}
                  >
                    {s.label}
                  </a>
                </li>
              );
            })}
          </ol>
          {action && href ? (
            <a href={href} className="press focus-ring mt-4 inline-flex h-11 w-full items-center justify-center rounded-full bg-primary px-4 text-callout font-medium text-primary-foreground">
              {action.label}
            </a>
          ) : null}
        </div>
      ) : null}
    </nav>
  );
}

export { SectionDock };
