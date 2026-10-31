"use client";

import * as React from "react";

import { Label } from "@/registry/aedis/ui/label";
import { ScrollMotionProvider } from "@/registry/aedis/ui/scroll-motion";
import { ScrollSteps } from "@/registry/aedis/ui/scroll-steps";
import { Switch } from "@/registry/aedis/ui/switch";

const steps = [
  { meta: "Weeks 1–2", title: "Listen", text: "Two weeks with the people who make and sell the work." },
  { meta: "Weeks 3–5", title: "Shape", text: "Three directions, tested on real signs and pages." },
  { meta: "Weeks 6–8", title: "Build", text: "The identity, the site and the templates, ready to run." },
  { meta: "Week 9", title: "Hand over", text: "Files, guides and a day of training." },
];

const models = ["One project, one price", "A month at a time", "A day each week"];

export default function ScrollStepsDemo() {
  const [fallback, setFallback] = React.useState(false);
  return (
    <div className="grid w-full max-w-xl gap-8 py-[45vh]">
      <div className="flex items-center gap-2">
        <Switch id="steps-fallback" checked={fallback} onCheckedChange={setFallback} />
        <Label htmlFor="steps-fallback">Force the JavaScript fallback</Label>
      </div>
      <ScrollMotionProvider fallback={fallback}>
        <ScrollSteps
          items={steps}
          end={{
            title: "How to hire us",
            children: (
              <ul className="grid gap-2 sm:grid-cols-3">
                {models.map((m) => (
                  <li key={m} className="rounded-md border border-hairline bg-surface p-3 text-callout">
                    {m}
                  </li>
                ))}
              </ul>
            ),
          }}
        />
      </ScrollMotionProvider>
    </div>
  );
}
