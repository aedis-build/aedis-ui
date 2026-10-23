import { Button } from "@/registry/aedis/ui/button";
import { Spinner } from "@/registry/aedis/ui/spinner";

export default function SpinnerDemo() {
  return (
    <div className="flex items-center gap-6">
      <Spinner />
      <Button disabled>
        <Spinner className="text-current" labels={{ label: "Sending" }} />
      </Button>
    </div>
  );
}
