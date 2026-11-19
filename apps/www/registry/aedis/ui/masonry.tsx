import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * One item from each group in turn, the groups in the order they first appear and each keeping its own order:
 * a, a, a, b, c, c → a, b, c, a, c, a.
 */
export function interleave<T>(items: readonly T[], groupOf: (item: T) => string): T[] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = groupOf(item);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  const queues = [...groups.values()];
  const out: T[] = [];
  for (let round = 0; out.length < items.length; round++) for (const q of queues) if (round < q.length) out.push(q[round]!);
  return out;
}

type MasonryProps<T> = Omit<React.ComponentProps<"ul">, "children"> & {
  items: readonly T[];
  /** A stable, unique key for each item, e.g. its file. */
  itemKey: (item: T) => string;
  /** Interleaves the items by this key (one from each group in turn), so a column is not one group. */
  groupBy?: (item: T) => string;
  /** The tile: a link to the file around a MediaFrame, a Video, any content that keeps its own ratio. */
  children: (item: T) => React.ReactNode;
};

/**
 * A list laid out in CSS columns (2, 3 from 760 px, 4 from 1200 px): each tile keeps its own height and is never split
 * across columns. No JavaScript lays it out, so it renders on the server. The columns fill top to bottom, so the
 * reading and focus order runs down the first column, then the next.
 */
function Masonry<T>({ items, itemKey, groupBy, children, className, ...props }: MasonryProps<T>) {
  const ordered = groupBy ? interleave(items, groupBy) : items;
  return (
    <ul data-slot="masonry" className={cn("columns-2 gap-3 min-[760px]:columns-3 min-[1200px]:columns-4", className)} {...props}>
      {ordered.map((item) => (
        <li key={itemKey(item)} data-slot="masonry-item" className="mb-3 break-inside-avoid">
          {children(item)}
        </li>
      ))}
    </ul>
  );
}

export { Masonry };
