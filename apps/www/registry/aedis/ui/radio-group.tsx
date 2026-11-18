"use client";

import * as React from "react";
import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";

import { cn, type WithClassName } from "@/lib/utils";

function RadioGroup({ className, ...props }: WithClassName<RadioGroupPrimitive.Props>) {
  return <RadioGroupPrimitive data-slot="radio-group" className={cn("grid gap-3", className)} {...props} />;
}

type RadioGroupItemProps =
  | (WithClassName<RadioPrimitive.Root.Props> & {
      /** The plain radio: every Base UI prop, title included (the HTML tooltip). */
      variant?: "default";
      icon?: never;
      description?: never;
    })
  | (Omit<WithClassName<RadioPrimitive.Root.Props>, "title"> & {
      /** "card" makes the whole card the radio, with an icon, a title and a description. */
      variant: "card";
      /** Decorative, hidden from assistive technology. */
      icon?: React.ReactNode;
      /** The option's name. */
      title?: React.ReactNode;
      /** One line under the title. */
      description?: React.ReactNode;
      /** Shown under the description, e.g. why a disabled option is unavailable. */
      children?: React.ReactNode;
    });

function RadioGroupItem(props: RadioGroupItemProps) {
  if (props.variant === "card") {
    const { className, variant: _variant, icon, title, description, children, ...rest } = props;
    return (
      <RadioPrimitive.Root
        data-slot="radio-group-item"
        data-variant="card"
        className={cn(
          // Selected: accent border plus an inset 1 px ring, so the card does not shift. Focus uses an outline so it never
          // collides with that ring. Disabled keeps its text readable (muted) instead of fading the whole card.
          "group/radio-card flex w-full cursor-pointer items-start gap-3 rounded-md border border-hairline bg-surface p-4 text-left text-callout outline-none transition-colors duration-(--duration-fast) ease-out hover:bg-muted focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring data-checked:border-accent data-checked:ring-1 data-checked:ring-inset data-checked:ring-accent data-disabled:cursor-not-allowed data-disabled:bg-muted data-disabled:text-muted-foreground data-disabled:hover:bg-muted",
          className,
        )}
        {...rest}
      >
        {icon ? (
          <span aria-hidden="true" data-slot="radio-group-card-icon" className="flex size-8 shrink-0 items-center justify-center rounded-sm border border-hairline bg-muted [&_svg]:size-4 group-data-checked/radio-card:text-accent">
            {icon}
          </span>
        ) : null}
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          {/* The spaces keep the accessible name readable: the card's name is its text, in reading order. */}
          <span data-slot="radio-group-card-title" className="font-medium">{title}</span>{" "}
          {description ? <span data-slot="radio-group-card-description" className="text-footnote text-muted-foreground">{description}</span> : null}{" "}
          {children ? <span data-slot="radio-group-card-note" className="text-footnote text-muted-foreground">{children}</span> : null}
        </span>
      </RadioPrimitive.Root>
    );
  }
  const { className, variant: _variant, ...rest } = props;
  return (
    <RadioPrimitive.Root
      data-slot="radio-group-item"
      className={cn(
        "focus-ring relative inline-flex aspect-square size-4 shrink-0 after:absolute after:-inset-1 after:content-[''] items-center justify-center rounded-full border border-border-control bg-surface text-primary transition-colors duration-(--duration-fast) ease-out data-disabled:cursor-not-allowed data-disabled:opacity-50 data-checked:border-primary",
        className,
      )}
      {...rest}
    >
      <RadioPrimitive.Indicator data-slot="radio-group-indicator" className="flex items-center justify-center">
        <span className="size-2 rounded-full bg-primary" />
      </RadioPrimitive.Indicator>
    </RadioPrimitive.Root>
  );
}

export { RadioGroup, RadioGroupItem };
