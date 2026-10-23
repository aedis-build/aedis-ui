import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/aedis/ui/tabs";

export default function TabsDemo() {
  return (
    <Tabs defaultValue="all">
      <TabsList>
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="agents">Created by agents</TabsTrigger>
      </TabsList>
      <TabsContent value="all" className="text-sm">Every automation.</TabsContent>
      <TabsContent value="agents" className="text-sm">Automations agents proposed.</TabsContent>
    </Tabs>
  );
}
