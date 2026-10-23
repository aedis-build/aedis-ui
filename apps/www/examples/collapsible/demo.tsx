import { Button } from "@/registry/aedis/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/registry/aedis/ui/collapsible";

export default function CollapsibleDemo() {
  return (
    <Collapsible className="max-w-lg space-y-2">
      <CollapsibleTrigger render={<Button variant="outline" />}>Show the three steps</CollapsibleTrigger>
      <CollapsibleContent>
        <ol className="list-decimal space-y-1 pl-5 text-callout">
          <li>Add the registry.</li>
          <li>Import the theme.</li>
          <li>Add a component.</li>
        </ol>
      </CollapsibleContent>
    </Collapsible>
  );
}
