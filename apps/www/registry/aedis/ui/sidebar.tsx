import * as React from "react";

import { cn } from "@/lib/utils";

export type SidebarItem = {
  href: string;
  label: string;
  /** Items waiting on a person (approvals, raised hands). Hidden when 0 or undefined. */
  count?: number;
  /** Accessible text for the counter, e.g. "3 waiting". Defaults to the number. */
  countLabel?: string;
  active?: boolean;
  icon?: React.ReactNode;
  /** Visible but not navigable, e.g. an area that opens after the first hire. */
  disabled?: boolean;
  /** Why the item is disabled; shown as a hint. */
  disabledReason?: string;
};

export type SidebarGroup = { label: string; items: SidebarItem[] };

type LinkProps = { href: string; className?: string; children: React.ReactNode; "aria-current"?: "page" };

export type SidebarProps = {
  groups: SidebarGroup[];
  header?: React.ReactNode;
  footer?: React.ReactNode;
  /** Router link component (e.g. Next.js Link). Defaults to a plain anchor. */
  linkComponent?: React.ComponentType<LinkProps>;
  /** Accessible name of the navigation landmark. Server Component: pass `messages.sidebar.label` for other languages. */
  label?: string;
  className?: string;
};

function DefaultLink(props: LinkProps) {
  return <a {...props} />;
}

function Sidebar({ groups, header, footer, linkComponent: Link = DefaultLink, label = "Main navigation", className }: SidebarProps) {
  return (
    <nav data-slot="sidebar" aria-label={label} className={cn("flex h-full flex-col gap-6 bg-primary px-3 py-4 text-primary-foreground", className)}>
      {header ? <div data-slot="sidebar-header">{header}</div> : null}
      {groups.map((group) => (
        <div key={group.label} data-slot="sidebar-group" className="flex flex-col gap-1">
          <p className="px-2 text-xs font-medium uppercase tracking-wide opacity-70">{group.label}</p>
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => (
              <li key={item.href}>
                {item.disabled ? (
                  <span
                    aria-disabled="true"
                    title={item.disabledReason}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm opacity-50"
                  >
                    {item.icon}
                    <span className="flex-1">{item.label}</span>
                    {item.disabledReason ? <span className="sr-only">({item.disabledReason})</span> : null}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    aria-current={item.active ? "page" : undefined}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none hover:bg-primary-foreground/10 focus-visible:ring-2 focus-visible:ring-ring aria-[current=page]:bg-primary-foreground/15 aria-[current=page]:font-medium"
                  >
                    {item.icon}
                    <span className="flex-1">{item.label}</span>
                    {item.count ? (
                      <span className="rounded-full bg-accent px-1.5 text-xs font-medium text-accent-foreground">
                        <span aria-hidden="true">{item.count}</span>
                        <span className="sr-only">{item.countLabel ?? String(item.count)}</span>
                      </span>
                    ) : null}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
      {footer ? <div data-slot="sidebar-footer" className="mt-auto text-sm">{footer}</div> : null}
    </nav>
  );
}

export { Sidebar };
