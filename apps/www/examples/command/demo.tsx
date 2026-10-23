"use client";

import * as React from "react";

import { Button } from "@/registry/aedis/ui/button";
import { CommandDialog, type CommandItem } from "@/registry/aedis/ui/command";
import { Kbd } from "@/registry/aedis/ui/kbd";

const agents: CommandItem[] = [
  { value: "sales", label: "Sales agent", description: "Pipeline follow-ups and proposals", group: "Agents" },
  { value: "support", label: "Support agent", description: "First answer on every ticket", group: "Agents" },
  { value: "approvals", label: "Approvals", description: "3 waiting", group: "Pages" },
  { value: "usage", label: "Usage and limits", description: "Ceilings per agent", group: "Pages" },
];

export default function CommandDemo() {
  const [open, setOpen] = React.useState(false);
  const [chosen, setChosen] = React.useState<string | null>(null);
  return (
    <div className="flex flex-col items-start gap-3">
      <Button variant="outline" onClick={() => setOpen(true)}>
        Go to… <Kbd>⌘K</Kbd>
      </Button>
      <p className="text-callout text-muted-foreground" aria-live="polite">{chosen ? `Opened ${chosen}` : "Nothing chosen yet."}</p>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        items={agents}
        onSelect={(item) => {
          setChosen(item.label);
          setOpen(false);
        }}
      />
    </div>
  );
}
