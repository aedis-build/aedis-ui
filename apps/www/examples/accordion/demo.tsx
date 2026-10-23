import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/registry/aedis/ui/accordion";

export default function AccordionDemo() {
  return (
    <Accordion className="max-w-lg">
      <AccordionItem value="who">
        <AccordionTrigger>Who approves what the agent sends?</AccordionTrigger>
        <AccordionContent>A person on the team. Anything that leaves the company waits in an Approval Card.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="data">
        <AccordionTrigger>Can the agent read my passwords?</AccordionTrigger>
        <AccordionContent>No. The session lives in an HttpOnly cookie that no script can read.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
