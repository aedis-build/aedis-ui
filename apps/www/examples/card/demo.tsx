import { Button } from "@/registry/aedis/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/registry/aedis/ui/card";

export default function CardDemo() {
  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle as="h2">Account Executive</CardTitle>
        <CardDescription>Turns opportunities into signed projects.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm">Junior · business hours · 3 channels</CardContent>
      <CardFooter>
        <Button size="sm">Interview</Button>
      </CardFooter>
    </Card>
  );
}
