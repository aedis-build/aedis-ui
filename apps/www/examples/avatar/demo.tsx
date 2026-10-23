import { Avatar, AvatarFallback } from "@/registry/aedis/ui/avatar";

export default function AvatarDemo() {
  return (
    <Avatar>
      <AvatarFallback>RA</AvatarFallback>
    </Avatar>
  );
}
