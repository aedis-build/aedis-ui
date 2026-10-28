import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Toggle } from "@/registry/aedis/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/registry/aedis/ui/toggle-group";
import { violations } from "./a11y";

describe("toggle (#190)", () => {
  it("is a button with aria-pressed, uncontrolled or controlled", async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn();
    const { container } = render(
      <>
        <Toggle aria-label="Bold">B</Toggle>
        <Toggle pressed onPressedChange={onPressedChange}>
          Pinned
        </Toggle>
      </>,
    );
    const bold = screen.getByRole("button", { name: "Bold" });
    expect(bold).toHaveAttribute("aria-pressed", "false");
    await user.click(bold);
    expect(bold).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Pinned" }));
    expect(onPressedChange).toHaveBeenCalledWith(false, expect.anything());
    expect(screen.getByRole("button", { name: "Pinned" })).toHaveAttribute("aria-pressed", "true");
    expect(await violations(container)).toEqual([]);
  });

  it("draws pressed with an outline, not color alone, and keeps a 44 px target", () => {
    render(<Toggle defaultPressed>On</Toggle>);
    const cls = screen.getByRole("button", { name: "On" }).className;
    expect(cls).toContain("data-pressed:inset-ring-[1.5px]");
    expect(cls).toContain("after:h-11");
  });
});

describe("toggle group (#190)", () => {
  const needs = (props: Partial<React.ComponentProps<typeof ToggleGroup>> = {}) => (
    <ToggleGroup aria-label="I need" {...props}>
      <ToggleGroupItem value="brand">Brand</ToggleGroupItem>
      <ToggleGroupItem value="site">Website</ToggleGroupItem>
      <ToggleGroupItem value="photo">Photos</ToggleGroupItem>
    </ToggleGroup>
  );

  it("is one tab stop: the arrows move and Space presses", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <>
        {needs({ multiple: true })}
        <button type="button">After</button>
      </>,
    );
    await user.tab();
    expect(screen.getByRole("button", { name: "Brand" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: "Website" })).toHaveFocus();
    await user.keyboard(" ");
    await user.keyboard("{ArrowRight}{Enter}");
    expect(screen.getByRole("button", { name: "Website" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Photos" })).toHaveAttribute("aria-pressed", "true");
    await user.tab();
    expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
    expect(await violations(container)).toEqual([]);
  });

  it("presses one at a time unless multiple", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(needs({ onValueChange }));
    await user.click(screen.getByRole("button", { name: "Brand" }));
    await user.click(screen.getByRole("button", { name: "Photos" }));
    expect(onValueChange).toHaveBeenLastCalledWith(["photo"], expect.anything());
    expect(screen.getByRole("button", { name: "Brand" })).toHaveAttribute("aria-pressed", "false");
  });

  it("segmented keeps one option pressed: pressing it again does not clear it", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <ToggleGroup variant="segmented" aria-label="Show" defaultValue={["photos"]} onValueChange={onValueChange}>
        <ToggleGroupItem value="photos">Photos</ToggleGroupItem>
        <ToggleGroupItem value="videos">Videos</ToggleGroupItem>
      </ToggleGroup>,
    );
    const photos = screen.getByRole("button", { name: "Photos" });
    await user.click(photos);
    expect(photos).toHaveAttribute("aria-pressed", "true");
    expect(onValueChange).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Videos" }));
    expect(onValueChange).toHaveBeenLastCalledWith(["videos"], expect.anything());
    expect(photos).toHaveAttribute("aria-pressed", "false");
  });

  it("moves with ↑ ↓ when vertical", async () => {
    const user = userEvent.setup();
    render(needs({ orientation: "vertical" }));
    await user.tab();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("button", { name: "Website" })).toHaveFocus();
  });
});
