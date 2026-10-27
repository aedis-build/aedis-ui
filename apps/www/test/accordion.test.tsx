import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/registry/aedis/ui/accordion";
import { Button } from "@/registry/aedis/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/registry/aedis/ui/collapsible";
import { violations } from "./a11y";

function Faq(props: { multiple?: boolean }) {
  return (
    <Accordion {...props}>
      <AccordionItem value="who">
        <AccordionTrigger>Who approves?</AccordionTrigger>
        <AccordionContent>A person on the team, never the agent itself.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="where">
        <AccordionTrigger>Where does data go?</AccordionTrigger>
        <AccordionContent>{"<img src=x onerror=alert(1)>"}</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

describe("Accordion", () => {
  it("moves between headers with the arrows, Home and End, wrapping at the ends (#160)", async () => {
    const user = userEvent.setup();
    render(<Faq />);
    const [who, where] = [screen.getByRole("button", { name: "Who approves?" }), screen.getByRole("button", { name: "Where does data go?" })];
    await user.tab();
    await user.keyboard("{ArrowDown}");
    expect(where).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(who).toHaveFocus();
    await user.keyboard("{End}");
    expect(where).toHaveFocus();
    await user.keyboard("{Home}");
    expect(who).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(where).toHaveFocus();
  });

  it("expands from the keyboard; Tab moves between headers (APG, no roving focus)", async () => {
    const user = userEvent.setup();
    render(<Faq />);
    const who = screen.getByRole("button", { name: "Who approves?" });
    expect(who).toHaveAttribute("aria-expanded", "false");
    await user.tab();
    await user.keyboard("{Enter}");
    expect(who).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("region", { name: "Who approves?" })).toHaveTextContent("A person on the team");
    await user.tab();
    expect(screen.getByRole("button", { name: "Where does data go?" })).toHaveFocus();
    await user.keyboard(" ");
    await waitFor(() => expect(who).toHaveAttribute("aria-expanded", "false"));
  });

  it("can keep several open", async () => {
    const user = userEvent.setup();
    render(<Faq multiple />);
    await user.click(screen.getByRole("button", { name: "Who approves?" }));
    await user.click(screen.getByRole("button", { name: "Where does data go?" }));
    expect(screen.getAllByRole("button", { expanded: true })).toHaveLength(2);
  });

  it("keeps collapsed content in the DOM for in-page search, as text", () => {
    const { container } = render(<Faq />);
    const panels = container.querySelectorAll("[data-slot=accordion-content]");
    expect(panels).toHaveLength(2);
    expect(panels[0]).toHaveAttribute("hidden", "until-found");
    expect(panels[1]).toHaveTextContent("<img src=x onerror=alert(1)>");
    expect(container.querySelector("img")).toBeNull();
  });

  it("animates height from the measured variable and not under reduced motion", () => {
    const { container } = render(<Faq />);
    const panel = container.querySelector("[data-slot=accordion-content]")!;
    expect(panel.className).toContain("h-(--accordion-panel-height)");
    expect(panel.className).toContain("motion-reduce:transition-none");
    expect(container.querySelector("svg")!.getAttribute("class")).toContain("group-data-panel-open:rotate-180");
  });

  it("has no accessibility violations", async () => {
    const user = userEvent.setup();
    const { container } = render(<Faq />);
    await user.click(screen.getByRole("button", { name: "Who approves?" }));
    expect(await violations(container)).toEqual([]);
  });
});

describe("Collapsible", () => {
  it("toggles from the keyboard and stays findable when closed", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Collapsible>
        <CollapsibleTrigger render={<Button variant="ghost" />}>Show steps</CollapsibleTrigger>
        <CollapsibleContent>Install, add the theme, add a component.</CollapsibleContent>
      </Collapsible>,
    );
    const trigger = screen.getByRole("button", { name: "Show steps" });
    const panel = container.querySelector("[data-slot=collapsible-content]")!;
    expect(panel).toHaveAttribute("hidden", "until-found");
    expect(panel.className).toContain("h-(--collapsible-panel-height)");
    await user.tab();
    await user.keyboard("{Enter}");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger).toHaveAttribute("aria-controls", panel.id);
    expect(await violations(container)).toEqual([]);
  });
});
