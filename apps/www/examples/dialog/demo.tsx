import { Button } from "@/registry/aedis/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/registry/aedis/ui/dialog";
import { Input } from "@/registry/aedis/ui/input";

export default function DialogDemo() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>Invite a person</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a person</DialogTitle>
          <DialogDescription>They join after accepting the invitation.</DialogDescription>
        </DialogHeader>
        <Input aria-label="Email" placeholder="name@company.com" />
      </DialogContent>
    </Dialog>
  );
}
