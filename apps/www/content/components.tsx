import type { ReactNode } from "react";

import { Button } from "@/registry/aedis/ui/button";

export type Prop = { name: string; type: string; default?: string; description: string };

export type ComponentDoc = {
  name: string;
  title: string;
  description: string;
  example: ReactNode;
  props: Prop[];
  security: string[];
};

/** One entry per registry item. The docs page and the sidebar are generated from this list. */
export const components: ComponentDoc[] = [
  {
    name: "button",
    title: "Button",
    description: "The base action. Defaults to type=\"button\", so it never submits a form by accident.",
    example: (
      <div className="flex flex-wrap gap-3">
        <Button>Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
      </div>
    ),
    props: [
      { name: "variant", type: '"default" | "secondary" | "outline" | "ghost" | "destructive" | "link"', default: '"default"', description: "Visual style." },
      { name: "size", type: '"default" | "sm" | "lg" | "icon"', default: '"default"', description: "Height and padding." },
      { name: "asChild", type: "boolean", default: "false", description: "Render the child element with the button styles." },
    ],
    security: ["Defaults to type=\"button\": submitting a form must be explicit (type=\"submit\")."],
  },
];
