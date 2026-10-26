"use client";

import * as React from "react";

import { PromptInput } from "@/registry/aedis/ui/prompt-input";

/** Pretends to stream an answer for two seconds so Stop can be tried. */
export default function PromptInputDemo() {
  const [last, setLast] = React.useState<string | null>(null);
  const [model, setModel] = React.useState("fast");
  return (
    <div className="w-full space-y-3">
      <PromptInput
        models={[{ value: "fast", label: "Fast" }, { value: "deep", label: "Deep research" }]}
        model={model}
        onModelChange={setModel}
        onSend={(message, { signal }) =>
          new Promise<void>((resolve) => {
            const t = setTimeout(() => (setLast(`${message.text} (${model})`), resolve()), 2000);
            signal.addEventListener("abort", () => (clearTimeout(t), setLast("Stopped."), resolve()));
          })
        }
      />
      {last ? <p className="text-footnote text-muted-foreground">Sent: {last}</p> : null}
    </div>
  );
}
