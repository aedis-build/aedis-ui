import { Button } from "@/registry/aedis/ui/button";
import { ButtonGroup, ButtonGroupSeparator } from "@/registry/aedis/ui/button-group";

export default function ButtonGroupDemo() {
  return (
    <ButtonGroup aria-label="Message actions">
      <Button variant="outline">Reply</Button>
      <Button variant="outline">Forward</Button>
      <ButtonGroupSeparator />
      <Button variant="outline">Archive</Button>
    </ButtonGroup>
  );
}
