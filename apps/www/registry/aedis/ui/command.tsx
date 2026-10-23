"use client";

import * as React from "react";

import { useMessages, type Messages } from "@/registry/aedis/lib/locale";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/registry/aedis/ui/dialog";
import { Input } from "@/registry/aedis/ui/input";

export type CommandLabels = Messages["command"];

/** One entry. Every field is shown as text, never as markup. */
export type CommandItem = { value: string; label: string; description?: string; group?: string };

type CommandProps = {
  items: CommandItem[];
  onSelect: (item: CommandItem) => void;
  labels?: Partial<CommandLabels>;
  className?: string;
};

/** Every word of the query must appear; items whose label matches come first. */
export function filterCommandItems(items: CommandItem[], query: string): CommandItem[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return items;
  const hits = items.filter((i) => {
    const text = `${i.label} ${i.description ?? ""} ${i.group ?? ""}`.toLowerCase();
    return words.every((w) => text.includes(w));
  });
  const inLabel = (i: CommandItem) => words.every((w) => i.label.toLowerCase().includes(w));
  return [...hits.filter(inLabel), ...hits.filter((i) => !inLabel(i))];
}

/**
 * A search box over a list: type to filter, ↑ ↓ to move, Enter to choose. Focus stays in the field and the active
 * option is announced through aria-activedescendant, as the ARIA combobox pattern specifies.
 */
function Command({ items, onSelect, labels, className }: CommandProps) {
  const l = useMessages("command", labels);
  const id = React.useId();
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const results = React.useMemo(() => filterCommandItems(items, query), [items, query]);
  const groups = [...new Set(results.map((r) => r.group ?? ""))];
  const ordered = groups.flatMap((g) => results.filter((r) => (r.group ?? "") === g));
  const current = ordered[Math.min(active, ordered.length - 1)];
  const optionId = (i: CommandItem) => `${id}-${ordered.indexOf(i)}`;

  React.useEffect(() => {
    if (current) document.getElementById(optionId(current))?.scrollIntoView?.({ block: "nearest" });
  });

  function onKeyDown(e: React.KeyboardEvent) {
    const last = ordered.length - 1;
    if (e.key === "ArrowDown") setActive((a) => (a >= last ? 0 : a + 1));
    else if (e.key === "ArrowUp") setActive((a) => (a <= 0 ? last : Math.min(a, last) - 1));
    else if (e.key === "Home") setActive(0);
    else if (e.key === "End") setActive(last);
    else if (e.key === "Enter" && current) onSelect(current);
    else return;
    e.preventDefault();
  }

  return (
    <div data-slot="command" className={cn("flex flex-col", className)}>
      <Input
        role="combobox"
        aria-label={l.label}
        aria-expanded="true"
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-activedescendant={current ? optionId(current) : undefined}
        placeholder={l.placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
        }}
        onKeyDown={onKeyDown}
        className="h-12 rounded-none border-0 border-b border-hairline bg-transparent px-4 text-body"
      />
      <div id={`${id}-list`} role="listbox" aria-label={l.label} className="max-h-80 overflow-y-auto scroll-fade-y p-2">
        {groups.map((g) => (
          <div key={g} role="group" aria-labelledby={g ? `${id}-g-${groups.indexOf(g)}` : undefined}>
            {g ? <div id={`${id}-g-${groups.indexOf(g)}`} className="px-2 pt-2 pb-1 text-caption font-medium text-muted-foreground">{g}</div> : null}
            {ordered.filter((r) => (r.group ?? "") === g).map((item) => (
              <div
                key={item.value}
                id={optionId(item)}
                role="option"
                aria-selected={item === current}
                onMouseMove={() => setActive(ordered.indexOf(item))}
                onClick={() => onSelect(item)}
                className="flex cursor-default flex-col rounded-sm px-2 py-1.5 text-callout aria-selected:bg-accent-soft"
              >
                <span>{item.label}</span>
                {item.description ? <span className="line-clamp-1 text-footnote opacity-80">{item.description}</span> : null}
              </div>
            ))}
          </div>
        ))}
      </div>
      {ordered.length === 0 ? <p role="status" className="px-4 pb-6 text-center text-callout text-muted-foreground">{l.empty}</p> : null}
    </div>
  );
}

/** Command in a modal dialog, e.g. a ⌘K search. The dialog title is the label, for screen readers. */
function CommandDialog({ open, onOpenChange, ...props }: CommandProps & { open: boolean; onOpenChange: (open: boolean) => void }) {
  const l = useMessages("command", props.labels);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[15%] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogTitle className="sr-only">{l.label}</DialogTitle>
        <Command {...props} />
      </DialogContent>
    </Dialog>
  );
}

export { Command, CommandDialog };
