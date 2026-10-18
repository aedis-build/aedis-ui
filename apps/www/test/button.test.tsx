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

  it("renders its child with asChild", () => {
    render(<Button asChild><a href="/docs">Docs</a></Button>);
    expect(screen.getByRole("link", { name: "Docs" })).toHaveAttribute("data-slot", "button");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Button>Approve</Button>);
    expect(await violations(container)).toEqual([]);
  });
});
