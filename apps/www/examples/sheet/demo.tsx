import { Button } from "@/registry/aedis/ui/button";
import { Input } from "@/registry/aedis/ui/input";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/registry/aedis/ui/sheet";

export default function SheetDemo() {
  return (
    <div className="flex flex-wrap gap-2">
      {(["right", "left", "bottom"] as const).map((side) => (
        <Sheet key={side} side={side}>
          <SheetTrigger render={<Button variant="outline" />}>Open {side}</SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Approval pending</SheetTitle>
              <SheetDescription>The agent wants to send the report outside the company.</SheetDescription>
            </SheetHeader>
            <Input aria-label="Note" placeholder="Add a note" />
            <SheetFooter>
              <SheetClose render={<Button />}>Done</SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      ))}
    </div>
  );
}
