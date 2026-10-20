import { render, screen } from "@testing-library/react";

import { Button } from "@/registry/aedis/ui/button";
import { violations } from "./a11y";

describe("Button", () => {
  it("does not submit a form unless asked", () => {
    const onSubmit = vi.fn((e: Event) => e.preventDefault());
    render(
      <form onSubmit={(e) => onSubmit(e.nativeEvent)}>
        <Button>Save draft</Button>
        <Button type="submit">Send</Button>
      </form>,
    );

    screen.getByRole("button", { name: "Save draft" }).click();
    expect(onSubmit).not.toHaveBeenCalled();

    screen.getByRole("button", { name: "Send" }).click();
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("renders another element with render", () => {
    render(<Button render={<a href="/docs" />}>Docs</Button>);
    expect(screen.getByRole("link", { name: "Docs" })).toHaveAttribute("data-slot", "button");
  });

  it("keeps the variant's text color and the size's type style together", () => {
    render(<Button size="lg">Start</Button>);
    expect(screen.getByRole("button", { name: "Start" })).toHaveClass("text-primary-foreground", "text-body");
  });

  it("lets a className replace a theme type style or elevation", () => {
    render(<Button className="text-footnote shadow-elevation-2">Small</Button>);
    const button = screen.getByRole("button", { name: "Small" });
    expect(button).toHaveClass("text-footnote", "text-primary-foreground", "shadow-elevation-2");
    expect(button).not.toHaveClass("text-callout", "shadow-elevation-1");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Button>Approve</Button>);
    expect(await violations(container)).toEqual([]);
  });
});
