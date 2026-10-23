import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Gallery } from "@/components/site/gallery";
import { violations } from "./a11y";

const items = [
  { name: "button", title: "Button", description: "Actions.", category: "Actions", sinks: [], preview: <button type="button">Preview</button> },
  { name: "input", title: "Input", description: "Bounded text.", category: "Forms", sinks: ["Input"] },
  { name: "checkbox", title: "Checkbox", description: "A choice.", category: "Forms", sinks: [] },
];

describe("components gallery", () => {
  it("filters by text and by category with the keyboard alone", async () => {
    const user = userEvent.setup();
    const { container } = render(<Gallery items={items} categories={["Actions", "Forms"]} />);
    expect(screen.getAllByRole("link")).toHaveLength(3);

    await user.tab();
    await user.keyboard("{ArrowRight}{ArrowRight}{Enter}");
    expect(screen.getByRole("tab", { name: "Forms" })).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByRole("heading", { name: "Actions" })).toBeNull();
    expect(screen.getAllByRole("link")).toHaveLength(2);

    await user.tab();
    await user.keyboard("chec");
    expect(screen.getAllByRole("link").map((l) => l.getAttribute("href"))).toEqual(["/docs/checkbox"]);
    await user.keyboard("kz");
    expect(screen.getByText("Nothing matches “checkz”.")).toBeInTheDocument();
    expect(await violations(container)).toEqual([]);
  });

  it("shows each card's category and sinks, with the preview inert", () => {
    render(<Gallery items={items} categories={["Actions", "Forms"]} />);
    const input = screen.getByRole("link", { name: /Input/ });
    expect(within(input).getByText("Input", { selector: "[data-slot=badge]" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Button/ }).querySelector("[inert]")).not.toBeNull();
  });
});
