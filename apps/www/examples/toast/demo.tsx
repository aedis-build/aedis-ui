"use client";

import { Button } from "@/registry/aedis/ui/button";
import { Toaster, useToast } from "@/registry/aedis/ui/toast";

function Buttons() {
  const toast = useToast();
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={() => toast.success("Draft saved", { description: "Your changes are safe." })}>Success</Button>
      <Button variant="outline" onClick={() => toast.show("Archived", { action: { label: "Undo", onClick: () => toast.info("Restored") } })}>With action</Button>
      <Button variant="outline" onClick={() => toast.failed({ description: "Nothing was sent." })}>Failure</Button>
    </div>
  );
}

export default function ToastDemo() {
  return (
    <Toaster>
      <Buttons />
    </Toaster>
  );
}
