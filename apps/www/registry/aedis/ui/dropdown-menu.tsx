"use client";

import * as React from "react";
import { Menu as MenuPrimitive } from "@base-ui/react/menu";

import { cn, type WithClassName } from "@/lib/utils";
import { useMessages, type Messages } from "@/registry/aedis/lib/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/registry/aedis/ui/alert-dialog";
import { ExternalMark, linkProps, type LinkLabels } from "@/registry/aedis/ui/link";

export type DropdownMenuLabels = Messages["dropdownMenu"];

/** What the confirmation of a destructive item says. Missing fields come from the dictionary. */
export type DropdownMenuConfirm = { title?: string | undefined; description?: string | undefined; action?: string | undefined };

type Request = DropdownMenuConfirm & { run: () => void };
type MenuContext = { confirm: (request: Request) => void; trigger: React.RefObject<HTMLElement | null> };
const Context = React.createContext<MenuContext | null>(null);

type RootProps = MenuPrimitive.Root.Props & { labels?: Partial<DropdownMenuLabels> };

/** A menu of actions. Destructive items never run directly: they go through an AlertDialog that starts on Cancel. */
function DropdownMenu({ children, labels, ...props }: RootProps) {
  const l = useMessages("dropdownMenu", labels);
  const trigger = React.useRef<HTMLElement>(null);
  const [open, setOpen] = React.useState(false);
  // Kept after closing so the dialog keeps its text while it animates out.
  const [request, setRequest] = React.useState<Request | null>(null);
  const value = React.useMemo<MenuContext>(() => ({ trigger, confirm: (r) => (setRequest(r), setOpen(true)) }), []);

  return (
    <Context.Provider value={value}>
      <MenuPrimitive.Root data-slot="dropdown-menu" {...props}>
        {children}
      </MenuPrimitive.Root>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent finalFocus={trigger}>
          <AlertDialogHeader>
            <AlertDialogTitle>{request?.title ?? l.confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{request?.description ?? l.confirmDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{l.cancel}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive-solid text-destructive-foreground hover:bg-destructive-solid/90" onClick={() => request?.run()}>
              {request?.action ?? l.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Context.Provider>
  );
}

function DropdownMenuTrigger({ ref, ...props }: MenuPrimitive.Trigger.Props) {
  const ctx = React.useContext(Context);
  const setRef = React.useCallback(
    (node: HTMLElement | null) => {
      if (ctx) ctx.trigger.current = node;
      if (typeof ref === "function") ref(node as HTMLButtonElement);
      else if (ref) (ref as React.RefObject<HTMLElement | null>).current = node;
    },
    [ctx, ref],
  );
  return <MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" ref={setRef} {...props} />;
}

type ContentProps = WithClassName<MenuPrimitive.Popup.Props> & Pick<MenuPrimitive.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset">;

function DropdownMenuContent({ className, align = "start", alignOffset, side = "bottom", sideOffset = 6, ...props }: ContentProps) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner className="z-50 outline-none" align={align} alignOffset={alignOffset} side={side} sideOffset={sideOffset}>
        <MenuPrimitive.Popup
          data-slot="dropdown-menu-content"
          className={cn(
            "materialize cascade material-regular max-h-(--available-height) min-w-44 overflow-y-auto rounded-md border border-hairline p-1 text-callout shadow-elevation-2 outline-none",
            className,
          )}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
}

const item =
  "relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 outline-none select-none transition-colors duration-(--duration-fast) ease-out data-highlighted:bg-accent-soft data-disabled:pointer-events-none data-disabled:opacity-50 data-inset:pl-8 [&_svg]:size-4 [&_svg]:shrink-0";

type ItemProps = WithClassName<MenuPrimitive.Item.Props> & {
  inset?: boolean;
  variant?: "default" | "destructive";
  /** Text of the confirmation a destructive item shows. */
  confirm?: DropdownMenuConfirm;
};

function DropdownMenuItem({ className, inset, variant = "default", confirm, onClick, children, ...props }: ItemProps) {
  const ctx = React.useContext(Context);
  const destructive = variant === "destructive";
  return (
    <MenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset || undefined}
      data-variant={variant}
      className={cn(item, destructive && "text-destructive data-highlighted:bg-destructive-solid data-highlighted:text-destructive-foreground", className)}
      onClick={
        destructive
          ? (event) => ctx?.confirm({ action: typeof children === "string" ? children.replace(/…$/, "") : undefined, ...confirm, run: () => onClick?.(event) })
          : onClick
      }
      {...props}
    >
      {children}
    </MenuPrimitive.Item>
  );
}

type LinkItemProps = Omit<WithClassName<MenuPrimitive.LinkItem.Props>, "href"> & { href: string; inset?: boolean; labels?: Partial<LinkLabels> };

/** A menu item that navigates. The href goes through safeUrl; a refused URL leaves the item disabled. */
function DropdownMenuLinkItem({ className, inset, href, labels, children, ...props }: LinkItemProps) {
  const link = linkProps(href);
  if (!link.href) {
    return (
      <MenuPrimitive.Item data-slot="dropdown-menu-item" data-inset={inset || undefined} disabled className={cn(item, className)}>
        {children}
      </MenuPrimitive.Item>
    );
  }
  return (
    <MenuPrimitive.LinkItem data-slot="dropdown-menu-link-item" data-inset={inset || undefined} href={link.href} rel={link.rel} className={cn(item, className)} {...props}>
      {children}
      {link.external ? <ExternalMark labels={labels} /> : null}
    </MenuPrimitive.LinkItem>
  );
}

function DropdownMenuCheckboxItem({ className, children, inset, ...props }: WithClassName<MenuPrimitive.CheckboxItem.Props> & { inset?: boolean }) {
  return (
    <MenuPrimitive.CheckboxItem data-slot="dropdown-menu-checkbox-item" data-inset={inset || undefined} className={cn(item, "pr-8", className)} {...props}>
      {children}
      <MenuPrimitive.CheckboxItemIndicator className="absolute right-2 flex items-center">
        <svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3.5 8.5l3 3 6-7" /></svg>
      </MenuPrimitive.CheckboxItemIndicator>
    </MenuPrimitive.CheckboxItem>
  );
}

function DropdownMenuRadioGroup(props: MenuPrimitive.RadioGroup.Props) {
  return <MenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />;
}

function DropdownMenuRadioItem({ className, children, inset, ...props }: WithClassName<MenuPrimitive.RadioItem.Props> & { inset?: boolean }) {
  return (
    <MenuPrimitive.RadioItem data-slot="dropdown-menu-radio-item" data-inset={inset || undefined} className={cn(item, "pr-8", className)} {...props}>
      {children}
      <MenuPrimitive.RadioItemIndicator className="absolute right-2 flex items-center">
        <span className="size-2 rounded-full bg-current" />
      </MenuPrimitive.RadioItemIndicator>
    </MenuPrimitive.RadioItem>
  );
}

function DropdownMenuGroup(props: MenuPrimitive.Group.Props) {
  return <MenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />;
}

const label = "px-2 py-1.5 text-caption text-muted-foreground data-inset:pl-8";

/** A heading anywhere in the menu. Inside a Group or RadioGroup, DropdownMenuGroupLabel also names the group. */
function DropdownMenuLabel({ className, inset, ...props }: React.ComponentProps<"div"> & { inset?: boolean }) {
  return <div data-slot="dropdown-menu-label" data-inset={inset || undefined} className={cn(label, className)} {...props} />;
}

function DropdownMenuGroupLabel({ className, inset, ...props }: WithClassName<MenuPrimitive.GroupLabel.Props> & { inset?: boolean }) {
  return <MenuPrimitive.GroupLabel data-slot="dropdown-menu-group-label" data-inset={inset || undefined} className={cn(label, className)} {...props} />;
}

function DropdownMenuSeparator({ className, ...props }: WithClassName<MenuPrimitive.Separator.Props>) {
  return <MenuPrimitive.Separator data-slot="dropdown-menu-separator" className={cn("-mx-1 my-1 h-px bg-hairline", className)} {...props} />;
}

function DropdownMenuShortcut({ className, ...props }: React.ComponentProps<"span">) {
  return <span data-slot="dropdown-menu-shortcut" className={cn("ml-auto font-mono text-footnote text-muted-foreground", className)} {...props} />;
}

function DropdownMenuSub(props: MenuPrimitive.SubmenuRoot.Props) {
  return <MenuPrimitive.SubmenuRoot data-slot="dropdown-menu-sub" {...props} />;
}

function DropdownMenuSubTrigger({ className, inset, children, ...props }: WithClassName<MenuPrimitive.SubmenuTrigger.Props> & { inset?: boolean }) {
  return (
    <MenuPrimitive.SubmenuTrigger data-slot="dropdown-menu-sub-trigger" data-inset={inset || undefined} className={cn(item, "data-popup-open:bg-accent-soft", className)} {...props}>
      {children}
      <svg viewBox="0 0 16 16" aria-hidden="true" className="ml-auto rtl:rotate-180" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m6 4 4 4-4 4" /></svg>
    </MenuPrimitive.SubmenuTrigger>
  );
}

function DropdownMenuSubContent({ side = "right", align = "start", alignOffset = -5, sideOffset = 2, ...props }: ContentProps) {
  return <DropdownMenuContent side={side} align={align} alignOffset={alignOffset} sideOffset={sideOffset} {...props} />;
}

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuGroupLabel,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuLinkItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
};
