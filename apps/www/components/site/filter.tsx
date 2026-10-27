"use client";

import { Button } from "@/registry/aedis/ui/button";

/**
 * Chips that narrow a list on the page: toggle buttons with aria-pressed. Not tabs, which would promise a tab panel
 * for each choice.
 */
export function Filter({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1 rounded-md bg-muted p-1">
      {options.map((o) => (
        <Button key={o} size="sm" variant="ghost" aria-pressed={o === value} onClick={() => onChange(o)} className="aria-pressed:bg-surface aria-pressed:text-foreground aria-pressed:shadow-elevation-1">
          {o}
        </Button>
      ))}
    </div>
  );
}
