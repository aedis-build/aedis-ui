import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// The theme's own scales. Unknown to tailwind-merge, `text-callout` would be read as a color and a later
// `text-primary-foreground` would drop the size (or the other way round), so each name goes in its group.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["display", "title-1", "title-2", "title-3", "headline", "body", "callout", "footnote", "caption", "code"] }],
      shadow: [{ shadow: ["elevation-1", "elevation-2", "elevation-3", "elevation-4"] }],
    },
  },
});

/** Joins class names and resolves Tailwind conflicts. Published as the `@aedis/utils` registry item. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Base UI also takes a className function of state; Aedis components take a plain string so `cn` can merge it. */
export type WithClassName<P> = Omit<P, "className"> & { className?: string };
