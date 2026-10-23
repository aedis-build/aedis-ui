import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Button } from "@/registry/aedis/ui/button";
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from "@/registry/aedis/ui/button-group";
import { Input } from "@/registry/aedis/ui/input";
import { ScrollArea } from "@/registry/aedis/ui/scroll-area";
import { violations } from "./a11y";

describe("ScrollArea", () => {
  it("keeps a native, labelled viewport and scrollbars that stay visible under reduced motion", async () => {
    const { container } = render(
      <ScrollArea aria-label="Release notes" className="h-40">
        {Array.from({ length: 40 }, (_, i) => (
          <p key={i}>Line {i}</p>
        ))}
      </ScrollArea>,
    );
    const viewport = screen.getByRole("region", { name: "Release notes" });
    expect(viewport).toHaveAttribute("data-slot", "scroll-area-viewport");
    expect(viewport.className).toContain("focus-visible:ring-inset"); // the root clips, so the ring is drawn inside
    for (const bar of container.querySelectorAll("[data-slot=scroll-area-scrollbar]")) {
      expect(bar.className).toContain("motion-reduce:opacity-100");
      expect(bar.className).toContain("motion-reduce:transition-none");
    }
    expect(await violations(container)).toEqual([]);
  });

  it("does not add a landmark without a label", () => {
    const { container } = render(<ScrollArea>Short</ScrollArea>);
    expect(container.querySelector("[data-slot=scroll-area-viewport]")).not.toHaveAttribute("role");
  });
});

describe("ButtonGroup", () => {
  it("is a named group whose buttons keep their own semantics and focus order", async () => {
    const user = userEvent.setup();
    const onArchive = vi.fn();
    const { container } = render(
      <>
        <ButtonGroup aria-label="Message actions">
          <Button variant="outline">Reply</Button>
          <Button variant="outline" onClick={onArchive}>Archive</Button>
          <ButtonGroupSeparator />
          <Button variant="outline" aria-label="More">…</Button>
        </ButtonGroup>
        <span id="search-label">Search</span>
        <ButtonGroup aria-labelledby="search-label" orientation="vertical">
          <ButtonGroupText>https://</ButtonGroupText>
          <Input aria-label="Address" />
        </ButtonGroup>
      </>,
    );
    expect(screen.getByRole("group", { name: "Message actions" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Search" })).toHaveAttribute("data-orientation", "vertical");
    await user.tab();
    expect(screen.getByRole("button", { name: "Reply" })).toHaveFocus();
    await user.tab();
    await user.keyboard("{Enter}");
    expect(onArchive).toHaveBeenCalledOnce();
    expect(screen.getAllByRole("button")).toHaveLength(3);
    expect(await violations(container)).toEqual([]);
  });

  it("does not compile without a name", () => {
    // @ts-expect-error a group needs aria-label or aria-labelledby
    const unnamed = <ButtonGroup><Button>A</Button></ButtonGroup>;
    expect(unnamed).toBeTruthy();
  });
});
