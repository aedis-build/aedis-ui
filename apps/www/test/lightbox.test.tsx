import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Lightbox } from "@/registry/aedis/ui/lightbox";
import { violations } from "./a11y";

const items = [
  { src: "/media/work-1.svg", alt: "Shop sign in terracotta", title: "Ceramics studio", caption: "Identity, 2026" },
  { src: "/media/work-2.svg", alt: "Signage by the greenhouse", title: "Garden centre" },
  { src: "/media/work-3.svg", alt: "Home page on a phone", title: "Bakery website" },
];

describe("lightbox (#195)", () => {
  it("opens the clicked item as a dialog named by its title, with a counter", async () => {
    const user = userEvent.setup();
    const { container } = render(<Lightbox items={items} />);
    expect(await violations(container)).toEqual([]);
    await user.click(screen.getByRole("button", { name: "Signage by the greenhouse" }));
    const dialog = await screen.findByRole("dialog", { name: "Garden centre" });
    expect(dialog).toHaveTextContent("2 of 3");
    expect(screen.getByRole("img", { name: "Signage by the greenhouse" })).toBeVisible();
    expect(await violations(dialog)).toEqual([]);
  });

  it("moves with the arrow keys and the buttons, wrapping around", async () => {
    const user = userEvent.setup();
    render(<Lightbox items={items} />);
    await user.click(screen.getByRole("button", { name: "Shop sign in terracotta" }));
    await screen.findByRole("dialog", { name: "Ceramics studio" });
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("dialog", { name: "Bakery website" })).toHaveTextContent("3 of 3");
    await user.keyboard("{ArrowRight}");
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("dialog", { name: "Garden centre" })).toBeInTheDocument();
  });

  it("wraps Tab at the edges, so the focus never leaves the open dialog", async () => {
    const user = userEvent.setup();
    render(<Lightbox items={items} />);
    await user.click(screen.getByRole("button", { name: "Shop sign in terracotta" }));
    const dialog = await screen.findByRole("dialog");
    screen.getByRole("button", { name: "Next" }).focus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole("button", { name: "Next" })).toHaveFocus();
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it("closes with Esc and gives the focus back to the thumbnail that opened it", async () => {
    const user = userEvent.setup();
    render(<Lightbox items={items} />);
    const thumb = screen.getByRole("button", { name: "Home page on a phone" });
    await user.click(thumb);
    await screen.findByRole("dialog");
    await user.keyboard("{ArrowRight}{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(thumb).toHaveFocus();
  });
});
