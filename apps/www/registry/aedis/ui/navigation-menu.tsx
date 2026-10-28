"use client";

import * as React from "react";
import { NavigationMenu as NavigationMenuPrimitive } from "@base-ui/react/navigation-menu";

import { cn, type WithClassName } from "@/lib/utils";
import { useMessages, type Messages } from "@/registry/aedis/lib/locale";
import { ExternalMark, linkProps, type LinkLabels } from "@/registry/aedis/ui/link";

export type NavigationMenuLabels = Messages["navigationMenu"];

type RootProps = WithClassName<NavigationMenuPrimitive.Root.Props> &
  Pick<NavigationMenuPrimitive.Positioner.Props, "align"> & { labels?: Partial<NavigationMenuLabels> };

/** Top navigation for a site, with panels of grouped links. An indicator slides under the open or current item. */
function NavigationMenu({ className, children, align = "start", labels, value: valueProp, defaultValue = null, onValueChange, "aria-label": ariaLabel, ...props }: RootProps) {
  const l = useMessages("navigationMenu", labels);
  const [ownValue, setOwnValue] = React.useState<unknown>(defaultValue);
  // How the open panel was opened: a press on a trigger whose panel hover already opened must keep it open.
  const openedBy = React.useRef<string | null>(null);
  const root = React.useRef<HTMLElement>(null);
  const [bar, setBar] = React.useState<{ x: number; width: number } | null>(null);

  const measure = React.useCallback(() => {
    const nav = root.current;
    if (!nav) return;
    const item =
      nav.querySelector<HTMLElement>("[data-slot=navigation-menu-trigger][data-popup-open]")?.closest("li") ??
      nav.querySelector<HTMLElement>("[data-slot=navigation-menu-item][data-active]");
    if (!item) return setBar(null);
    const [n, i] = [nav.getBoundingClientRect(), item.getBoundingClientRect()];
    setBar({ x: i.left - n.left, width: i.width });
  }, []);

  React.useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  return (
    <NavigationMenuPrimitive.Root
      ref={root}
      data-slot="navigation-menu"
      aria-label={ariaLabel ?? l.label}
      value={valueProp === undefined ? ownValue : valueProp}
      onValueChange={(value, details) => {
        if (value === null && details.reason === "trigger-press" && openedBy.current === "trigger-hover") {
          // The pointer rested, the panel opened, then the click came: the person wants it open. A second click closes.
          openedBy.current = "trigger-press";
          return;
        }
        openedBy.current = value === null ? null : details.reason;
        setOwnValue(value);
        onValueChange?.(value, details);
        requestAnimationFrame(measure);
      }}
      className={cn("relative flex max-w-max flex-1 items-center", className)}
      {...props}
    >
      {children}
      <span
        aria-hidden="true"
        data-slot="navigation-menu-indicator"
        className="pointer-events-none absolute bottom-0 left-0 h-0.5 w-px origin-left rounded-full bg-primary transition-[translate,scale,opacity] duration-(--duration-spring) ease-spring-critical motion-reduce:transition-none"
        style={{ translate: `${bar?.x ?? 0}px 0`, scale: `${bar?.width ?? 0} 1`, opacity: bar ? 1 : 0 }}
      />
      <NavigationMenuPrimitive.Portal>
        <NavigationMenuPrimitive.Positioner side="bottom" sideOffset={8} align={align} className="z-50">
          <NavigationMenuPrimitive.Popup
            data-slot="navigation-menu-popup"
            className="materialize material-regular relative h-(--popup-height) w-(--popup-width) overflow-hidden rounded-md border border-hairline shadow-elevation-2 outline-none"
          >
            <NavigationMenuPrimitive.Viewport className="relative size-full" />
          </NavigationMenuPrimitive.Popup>
        </NavigationMenuPrimitive.Positioner>
      </NavigationMenuPrimitive.Portal>
    </NavigationMenuPrimitive.Root>
  );
}

function NavigationMenuList({ className, ...props }: WithClassName<NavigationMenuPrimitive.List.Props>) {
  return <NavigationMenuPrimitive.List data-slot="navigation-menu-list" className={cn("flex list-none items-center gap-1", className)} {...props} />;
}

/** `active` marks the item of the current section, where the indicator rests when no panel is open. */
function NavigationMenuItem({ className, active, ...props }: WithClassName<NavigationMenuPrimitive.Item.Props> & { active?: boolean | undefined }) {
  return <NavigationMenuPrimitive.Item data-slot="navigation-menu-item" data-active={active || undefined} className={cn("relative", className)} {...props} />;
}

const triggerStyle =
  "press focus-ring inline-flex h-9 w-max items-center justify-center gap-1 rounded-sm px-3 text-callout font-medium hover:bg-muted data-popup-open:bg-muted";

function NavigationMenuTrigger({ className, children, onKeyDown, ...props }: WithClassName<NavigationMenuPrimitive.Trigger.Props>) {
  return (
    <NavigationMenuPrimitive.Trigger
      data-slot="navigation-menu-trigger"
      className={cn(triggerStyle, "group", className)}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        // ↓ on the trigger of an open panel moves into the panel, to its first link.
        if (event.key !== "ArrowDown" || !event.currentTarget.hasAttribute("data-popup-open")) return;
        const first = document.querySelector<HTMLElement>("[data-slot=navigation-menu-popup] a[href], [data-slot=navigation-menu-popup] [data-slot=navigation-menu-link]");
        if (!first) return;
        event.preventDefault();
        first.focus();
      }}
      {...props}
    >
      {children}
      <NavigationMenuPrimitive.Icon className="transition-transform duration-(--duration-fast) ease-out group-data-popup-open:rotate-180 motion-reduce:transition-none">
        <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="m4 6 4 4 4-4" />
        </svg>
      </NavigationMenuPrimitive.Icon>
    </NavigationMenuPrimitive.Trigger>
  );
}

function NavigationMenuContent({ className, ...props }: WithClassName<NavigationMenuPrimitive.Content.Props>) {
  return (
    <NavigationMenuPrimitive.Content
      data-slot="navigation-menu-content"
      className={cn(
        "p-2 transition-[opacity,translate] duration-(--duration-base) ease-cinematic data-starting-style:translate-y-1 data-starting-style:opacity-0 data-ending-style:opacity-0 data-ending-style:duration-(--duration-fast) motion-reduce:translate-y-0",
        className,
      )}
      {...props}
    />
  );
}

type LinkProps = Omit<WithClassName<NavigationMenuPrimitive.Link.Props>, "href"> & { href: string; labels?: Partial<LinkLabels> };

/** A link whose href goes through safeUrl; external links get noopener noreferrer and a visible marker. */
function NavigationMenuLink({ className, href, children, labels, ...props }: LinkProps) {
  const link = linkProps(href);
  return (
    <NavigationMenuPrimitive.Link
      data-slot="navigation-menu-link"
      {...(link.href ? { href: link.href, rel: link.rel } : { render: <span /> })}
      className={cn(
        "focus-ring block rounded-sm px-3 py-2 text-callout transition-colors duration-(--duration-fast) ease-out hover:bg-muted data-active:bg-accent-soft data-active:font-medium",
        className,
      )}
      {...props}
    >
      {children}
      {link.external ? <ExternalMark labels={labels} /> : null}
    </NavigationMenuPrimitive.Link>
  );
}

export { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, triggerStyle as navigationMenuTriggerStyle };
