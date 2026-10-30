import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { contrast } from "@/registry/aedis/lib/contrast";
import { colors } from "@/registry/aedis/lib/tokens";
import { ImageAccordion } from "@/registry/aedis/ui/image-accordion";
import { violations } from "./a11y";

const items = [
  { image: "/a.svg", alt: "The shop sign", kicker: "Principle", label: "Craft", text: "Drawn by hand." },
  { image: "/b.svg", alt: "The greenhouse door", label: "Place", text: "Where the brand lives." },
  { image: "/c.svg", alt: "The phone", label: "Use", text: "Run by the team." },
];
const panel = (name: string) => screen.getByRole("button", { name });

describe("image accordion (#243)", () => {
  it("is a group of buttons with aria-expanded, every text in the page, and has no accessibility violations", async () => {
    const { container } = render(<ImageAccordion aria-label="Principles" items={items} />);
    expect(screen.getByRole("group", { name: "Principles" })).toBeInTheDocument();
    expect(panel("Craft")).toHaveAttribute("aria-expanded", "true");
    expect(panel("Place")).toHaveAttribute("aria-expanded", "false");
    // Closed panels keep their text: it describes the button, with the image's alt.
    expect(panel("Use")).toHaveAccessibleDescription("Run by the team. The phone");
    expect(container.querySelector("[style]")).toHaveStyle({ "--min-open": "min(440px, 56cqi)" });
    expect(await violations(container)).toEqual([]);
  });

  it("opens on hover only after 100 ms, so sweeping across the row opens nothing, and never from a touch", () => {
    vi.useFakeTimers();
    try {
      const onOpenChange = vi.fn();
      render(<ImageAccordion items={items} onOpenChange={onOpenChange} />);
      fireEvent.pointerEnter(panel("Place"), { pointerType: "mouse" });
      act(() => vi.advanceTimersByTime(60));
      fireEvent.pointerLeave(panel("Place"));
      fireEvent.pointerEnter(panel("Use"), { pointerType: "mouse" });
      act(() => vi.advanceTimersByTime(99));
      expect(panel("Use")).toHaveAttribute("aria-expanded", "false");
      act(() => vi.advanceTimersByTime(1));
      expect(panel("Use")).toHaveAttribute("aria-expanded", "true");
      expect(onOpenChange.mock.calls).toEqual([[2]]);

      fireEvent.pointerEnter(panel("Craft"), { pointerType: "touch" });
      act(() => vi.advanceTimersByTime(200));
      expect(panel("Craft")).toHaveAttribute("aria-expanded", "false");
    } finally {
      vi.useRealTimers();
    }
  });

  it("with openOn click ignores hover and opens on a press", async () => {
    const user = userEvent.setup();
    render(<ImageAccordion items={items} openOn="click" defaultOpen={1} />);
    fireEvent.pointerEnter(panel("Use"), { pointerType: "mouse" });
    await new Promise((r) => setTimeout(r, 150));
    expect(panel("Use")).toHaveAttribute("aria-expanded", "false");
    await user.click(panel("Use"));
    expect(panel("Use")).toHaveAttribute("aria-expanded", "true");
    expect(panel("Place")).toHaveAttribute("aria-expanded", "false");
  });

  it("is one tab stop, and the arrow keys, Home and End open each panel", async () => {
    const user = userEvent.setup();
    render(<><button type="button">Before</button><ImageAccordion items={items} /></>);
    await user.click(screen.getByRole("button", { name: "Before" }));
    await user.tab();
    expect(panel("Craft")).toHaveFocus();
    for (const [key, name] of [["{ArrowRight}", "Place"], ["{ArrowDown}", "Use"], ["{ArrowRight}", "Use"], ["{Home}", "Craft"], ["{End}", "Use"], ["{ArrowUp}", "Place"], ["{ArrowLeft}", "Craft"], ["{ArrowLeft}", "Craft"]] as const) {
      await user.keyboard(key);
      expect(panel(name)).toHaveFocus();
      expect(panel(name)).toHaveAttribute("aria-expanded", "true");
      expect(panel(name)).toHaveAttribute("tabindex", "0");
    }
    await user.keyboard("{Enter}a");
    expect(panel("Craft")).toHaveAttribute("aria-expanded", "true");
  });

  it("lays out as a row, a stack, or both by width", () => {
    const { container, rerender } = render(<ImageAccordion items={items} orientation="horizontal" minOpen="20rem" />);
    const root = () => container.firstElementChild!;
    expect(root()).toHaveClass("flex-row", "h-[30rem]");
    expect(root()).toHaveStyle({ "--min-open": "20rem" });
    rerender(<ImageAccordion items={items} orientation="vertical" />);
    expect(root()).toHaveClass("flex-col");
    expect(root()).not.toHaveClass("md:h-[30rem]");
    rerender(<ImageAccordion items={items} />);
    expect(root()).toHaveClass("flex-col", "md:flex-row", "md:h-[30rem]");
  });

  // The docs quote these: white text over the scrims, on the worst photograph there is, a white one.
  it("keeps white text at 4.5:1 or more over a white photograph", () => {
    expect(contrast(colors["on-media"].light, colors["media-scrim"].light, "#ffffff")).toBeCloseTo(5.74, 1);
    expect(contrast(colors["on-media"].light, colors["media-scrim-strong"].light, "#ffffff")).toBeGreaterThan(12);
  });
});
