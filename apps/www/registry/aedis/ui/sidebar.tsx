import * as React from "react";

import { cn } from "@/lib/utils";

type SidebarItemBase = {
  label: string;
  /** Items waiting on a person (approvals, raised hands). Hidden when 0 or undefined. */
  count?: number;
  /** Accessible text for the counter, e.g. "3 waiting". Defaults to the number. */
  countLabel?: string;
  active?: boolean;
  icon?: React.ReactNode;
  /** Visible but not navigable, e.g. an area that opens after the first hire. */
  disabled?: boolean;
  /** Why the item is disabled; shown under its label. */
  disabledReason?: string;
};

/** A link, or a collapsible section of further items (two levels below a group is the intended depth). */
export type SidebarItem = SidebarItemBase &
  (
    | { href: string; items?: undefined; open?: undefined }
    | {
        href?: undefined;
        items: SidebarItem[];
        /** Open state. Defaults to open when the section holds the active item; pair with `onOpenChange` to control it. */
        open?: boolean;
      }
  );

export type SidebarGroup = { label: string; items: SidebarItem[] };

type LinkProps = { href: string; className?: string; children: React.ReactNode; "aria-current"?: "page" | undefined };

export type SidebarProps = {
  groups: SidebarGroup[];
  header?: React.ReactNode;
  footer?: React.ReactNode;
  /** Router link component (e.g. Next.js Link). Defaults to a plain anchor. */
  linkComponent?: React.ComponentType<LinkProps>;
  /** Accessible name of the navigation landmark. Server Component: pass `messages.sidebar.label` for other languages. */
  label?: string;
  /** Called when a person opens or closes a section. */
  onOpenChange?: (section: SidebarItem, open: boolean) => void;
  className?: string;
};

function DefaultLink(props: LinkProps) {
  return <a {...props} />;
}

const holdsActive = (item: SidebarItem): boolean => !!item.active || !!item.items?.some(holdsActive);

// 44 px on touch screens; the pointer keeps the compact row.
const row = "flex items-center gap-2 rounded-sm px-2 py-1.5 text-callout pointer-coarse:min-h-11";

function Count({ item }: { item: SidebarItem }) {
  return item.count ? (
    <span className="rounded-full bg-accent px-1.5 text-caption text-accent-foreground">
      <span aria-hidden="true">{item.count}</span>
      <span className="sr-only">{item.countLabel ?? String(item.count)}</span>
    </span>
  ) : null;
}

// The open value React last rendered for each section, as seen at its last toggle event.
const rendered = new WeakMap<HTMLDetailsElement, boolean>();

type ItemsProps = { items: SidebarItem[]; Link: React.ComponentType<LinkProps>; onOpenChange?: SidebarProps["onOpenChange"]; nested?: boolean };

function Items({ items, Link, onOpenChange, nested }: ItemsProps) {
  return (
    <ul className={cn("flex flex-col gap-0.5", nested && "ml-3.5 border-l border-hairline pl-2")}>
      {items.map((item) => (
        <li key={item.href ?? item.label}>
          {item.disabled ? (
            // The reason is written out under the label: a title only shows on hover, never on touch.
            <span aria-disabled="true" className="flex items-start gap-2 rounded-sm px-2 py-1.5 text-callout text-muted-foreground">
              {item.icon}
              <span className="flex flex-1 flex-col">
                <span className="opacity-60">{item.label}</span>
                {item.disabledReason ? <span className="text-caption">{item.disabledReason}</span> : null}
              </span>
            </span>
          ) : item.items ? (
            // Native details/summary: Tab reaches the summary, Enter and Space toggle it, and it works without JavaScript.
            <details
              data-slot="sidebar-section"
              open={item.open ?? holdsActive(item)}
              onToggle={
                onOpenChange
                  ? (e) => {
                      // The browser also fires toggle when React sets `open` (on mount, or a new controlled value): that lands on
                      // the value just rendered. Only a change made by a person is reported.
                      const el = e.currentTarget;
                      const open = item.open ?? holdsActive(item);
                      const was = rendered.get(el);
                      rendered.set(el, open);
                      if (el.open === open && was !== open) return;
                      onOpenChange(item, el.open);
                    }
                  : undefined
              }
            >
              <summary
                // A closed section that holds the current page keeps its title in medium weight, so the location never vanishes.
                data-active={holdsActive(item) || undefined}
                className={cn(row, "press focus-ring cursor-pointer list-none hover:bg-muted data-active:font-medium [&::-webkit-details-marker]:hidden")}
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>
                <Count item={item} />
                <svg
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                  className="size-4 shrink-0 text-muted-foreground transition-transform duration-(--duration-spring) ease-spring-critical [details[open]>summary>&]:rotate-90 motion-reduce:transition-none"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="m6 4 4 4-4 4" />
                </svg>
              </summary>
              <Items items={item.items} Link={Link} onOpenChange={onOpenChange} nested />
            </details>
          ) : (
            <Link
              href={item.href!}
              aria-current={item.active ? "page" : undefined}
              // The current page keeps its background and gains a 2 px line in thread at the inline start: a marker, never a fill.
              className={cn(
                row,
                "press focus-ring relative hover:bg-muted aria-[current=page]:bg-accent-soft aria-[current=page]:font-medium aria-[current=page]:before:absolute aria-[current=page]:before:inset-y-1.5 aria-[current=page]:before:start-0 aria-[current=page]:before:w-0.5 aria-[current=page]:before:rounded-full aria-[current=page]:before:bg-thread",
              )}
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              <Count item={item} />
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}

function Sidebar({ groups, header, footer, linkComponent: Link = DefaultLink, label = "Main navigation", onOpenChange, className }: SidebarProps) {
  return (
    <nav data-slot="sidebar" aria-label={label} className={cn("material-thick flex h-full flex-col gap-6 border-r border-hairline px-3 py-4 text-foreground", className)}>
      {header ? <div data-slot="sidebar-header">{header}</div> : null}
      {groups.map((group) => (
        <div key={group.label} data-slot="sidebar-group" className="flex flex-col gap-1">
          <p className="px-2 text-caption uppercase text-muted-foreground">{group.label}</p>
          <Items items={group.items} Link={Link} onOpenChange={onOpenChange} />
        </div>
      ))}
      {footer ? <div data-slot="sidebar-footer" className="mt-auto text-callout">{footer}</div> : null}
    </nav>
  );
}

export { Sidebar };
