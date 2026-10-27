import { Alert, AlertDescription, AlertTitle } from "@/registry/aedis/ui/alert";

export default function AlertDemo() {
  return (
    <div className="grid gap-3">
      <Alert>
        <AlertTitle>Approvals moved</AlertTitle>
        <AlertDescription>Pending approvals now live in the sidebar.</AlertDescription>
      </Alert>
      <Alert variant="success">
        <AlertTitle>Proposal sent</AlertTitle>
        <AlertDescription>Acme Bistro has it in their inbox.</AlertDescription>
      </Alert>
      <Alert variant="warning">
        <AlertTitle>Ceiling at 90%</AlertTitle>
        <AlertDescription>The support agent stops at its daily limit in about an hour.</AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <AlertTitle>Could not send the proposal</AlertTitle>
        <AlertDescription>Nothing was sent. Try again in a minute.</AlertDescription>
      </Alert>
    </div>
  );
}
