import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import RadioGroupCards from "@/examples/radio-group/cards";
import { RadioGroup, RadioGroupItem } from "@/registry/aedis/ui/radio-group";

import { violations } from "./a11y";

describe("RadioGroupItem variant=card", () => {
  it("names the card by its text in reading order and hides the icon", () => {
    render(
      <RadioGroup aria-label="Product" defaultValue="identity">
        <RadioGroupItem variant="card" value="identity" icon={<svg />} title="Identity" description="Sign-in for your users." />
      </RadioGroup>,
    );
    const card = screen.getByRole("radio", { name: "Identity Sign-in for your users." });
    expect(card).toHaveAttribute("aria-checked", "true");
    expect(card).toHaveAttribute("data-variant", "card");
    expect(card.querySelector("[data-slot=radio-group-card-icon]")).toHaveAttribute("aria-hidden", "true");
  });

  it("checks on a press anywhere on the card", async () => {
    const user = userEvent.setup();
    render(<RadioGroupCards />);
    await user.click(screen.getByText("AI agent"));
    expect(screen.getByRole("radio", { name: /^AI agent/ })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByTestId("radio-cards-summary")).toHaveTextContent("Selected: Identity, AI agent.");
  });

  it("is one tab stop per group, and arrows move and check, skipping disabled cards", async () => {
    const user = userEvent.setup();
    render(<RadioGroupCards />);
    await user.tab();
    const identity = screen.getByRole("radio", { name: /^Identity/ });
    expect(identity).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    const compliance = screen.getByRole("radio", { name: /^Compliance/ });
    expect(compliance).toHaveFocus();
    expect(compliance).toHaveAttribute("aria-checked", "true");
    // The contracted-only cards are disabled, so the arrow wraps back to Identity.
    await user.keyboard("{ArrowRight}");
    expect(identity).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("radio", { name: /^Server app/ })).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("radio", { name: /^SPA or mobile/ })).toHaveAttribute("aria-checked", "true");
  });

  it("announces disabled cards as unavailable, keeps their text and shows the reason", async () => {
    const user = userEvent.setup();
    render(<RadioGroupCards />);
    const keys = screen.getByRole("radio", { name: "Managed keys Encryption keys held in your own vault. Contracted with our team" });
    expect(keys).toHaveAttribute("aria-disabled", "true");
    expect(keys).toHaveAttribute("data-disabled");
    expect(keys.className).not.toMatch(/opacity/);
    await user.click(keys);
    expect(keys).toHaveAttribute("aria-checked", "false");
  });

  it("each group is named by its legend", () => {
    render(<RadioGroupCards />);
    expect(screen.getByRole("radiogroup", { name: "Product" })).toBeInTheDocument();
    expect(screen.getByRole("radiogroup", { name: "Application type" })).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(<RadioGroupCards />);
    expect(await violations(container)).toEqual([]);
  });
});
