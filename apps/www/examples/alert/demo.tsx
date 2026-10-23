import { Alert, AlertDescription, AlertTitle } from "@/registry/aedis/ui/alert";

export default function AlertDemo() {
  return (
    <div className="grid gap-3">
      <Alert>
        <AlertTitle>Approvals moved</AlertTitle>
        <AlertDescription>Pending approvals now live in the sidebar.</AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <AlertTitle>Could not send the proposal</AlertTitle>
        <AlertDescription>Nothing was sent. Try again in a minute.</AlertDescription>
      </Alert>
    </div>
  );
}
