"use client";

import * as React from "react";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { ExternalMark, linkProps } from "@/registry/aedis/ui/link";
import { Separator } from "@/registry/aedis/ui/separator";

const InGroup = React.createContext(false);

/** A list of items: each Item becomes a listitem. */
function ItemGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <InGroup.Provider value={true}>
      <div role="list" data-slot="item-group" className={cn("flex w-full flex-col gap-2", className)} {...props} />
    </InGroup.Provider>
  );
}

function ItemSeparator({ className, ...props }: React.ComponentProps<typeof Separator>) {
  return <Separator data-slot="item-separator" orientation="horizontal" className={cn("my-1", className)} {...props} />;
}

const itemVariants = cva(
  "group/item flex w-full flex-wrap items-center gap-3 rounded-md border text-callout outline-none transition-colors duration-(--duration-fast) ease-out [a&]:focus-ring [a&]:hover:bg-muted",
  {
    variants: {
      variant: {
        default: "border-transparent",
        outline: "border-hairline bg-surface",
        muted: "border-transparent bg-muted",
      },
      size: {
        default: "px-4 py-3",
        sm: "px-3 py-2",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

type ItemProps = useRender.ComponentProps<"div"> & VariantProps<typeof itemVariants> & {
  /** Makes the whole row a link. Goes through safeUrl; external links get noopener noreferrer and a marker. */
  href?: string;
};

/** A row in a list: media, content and actions. */
function Item({ className, variant, size, render, href, children, ...props }: ItemProps) {
  const inGroup = React.useContext(InGroup);
  const link = href === undefined ? null : linkProps(href);
  const isLink = Boolean(link?.href);
  const element = useRender({
    defaultTagName: "div",
    render: isLink ? (render ?? <a />) : render,
    props: {
      "data-slot": "item",
      "data-variant": variant ?? "default",
      // A link keeps its own role; the list item is a wrapper around it.
      ...(inGroup && !isLink ? { role: "listitem" } : {}),
      ...(isLink ? { href: link!.href, rel: link!.rel } : {}),
      className: cn(itemVariants({ variant, size }), className),
      ...props,
      children: (
        <>
          {children}
          {link?.external ? <ExternalMark /> : null}
        </>
      ),
    },
  });
  return inGroup && isLink ? <div role="listitem">{element}</div> : element;
}

const itemMediaVariants = cva("flex shrink-0 items-center justify-center gap-2 group-has-data-[slot=item-description]/item:self-start [&_svg]:pointer-events-none", {
  variants: {
    variant: {
      default: "bg-transparent",
      icon: "size-8 rounded-sm border border-hairline bg-muted [&_svg]:size-4",
      image: "size-10 overflow-hidden rounded-sm [&_img]:size-full [&_img]:object-cover",
    },
  },
  defaultVariants: { variant: "default" },
});

function ItemMedia({ className, variant, ...props }: React.ComponentProps<"div"> & VariantProps<typeof itemMediaVariants>) {
  return <div data-slot="item-media" data-variant={variant ?? "default"} className={cn(itemMediaVariants({ variant }), className)} {...props} />;
}

function ItemContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="item-content" className={cn("flex flex-1 flex-col gap-0.5", className)} {...props} />;
}

function ItemTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="item-title" className={cn("flex w-fit items-center gap-2 font-medium", className)} {...props} />;
}

function ItemDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="item-description" className={cn("line-clamp-2 text-footnote text-muted-foreground", className)} {...props} />;
}

function ItemActions({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="item-actions" className={cn("flex items-center gap-2", className)} {...props} />;
}

function ItemHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="item-header" className={cn("flex basis-full items-center justify-between gap-2", className)} {...props} />;
}

function ItemFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="item-footer" className={cn("flex basis-full items-center justify-between gap-2", className)} {...props} />;
}

export { Item, ItemActions, ItemContent, ItemDescription, ItemFooter, ItemGroup, ItemHeader, ItemMedia, ItemSeparator, ItemTitle, itemVariants };
