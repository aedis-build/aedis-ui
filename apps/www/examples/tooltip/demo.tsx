import { Button } from "@/registry/aedis/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/registry/aedis/ui/tooltip";

export default function TooltipDemo() {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline" />}>Ceiling</TooltipTrigger>
      <TooltipContent>The most this agent can cost per day.</TooltipContent>
    </Tooltip>
  );
}
