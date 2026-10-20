import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { themeCss } from "@/registry/aedis/lib/theme-css";
import { LocaleProvider } from "@/registry/aedis/lib/locale";
import { ptBR } from "@/registry/aedis/lib/locales/pt-br";
import { Button } from "@/registry/aedis/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetIndent,
  SheetIndentBackground,
  SheetProvider,
  SheetTitle,
  SheetTrigger,
  type SheetSide,
} from "@/registry/aedis/ui/sheet";
import { violations } from "./a11y";

function Example({ side }: { side?: SheetSide }) {
  return (
    <SheetProvider>
      <SheetIndentBackground />
      <SheetIndent>
        <button type="button">Outside</button>
        <Sheet side={side}>
          <SheetTrigger render={<Button />}>Filters</SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
              <SheetDescription>Narrow the agents list.</SheetDescription>
            </SheetHeader>
            <input aria-label="Name" />
            <SheetFooter>
              <SheetClose render={<Button />}>Apply</SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </SheetIndent>
    </SheetProvider>
  );
}

describe("Sheet", () => {
  it("is a labelled modal dialog that traps focus and returns it on close", async () => {
    const user = userEvent.setup();
    render(<Example />);
    const trigger = screen.getByRole("button", { name: "Filters" });
    await user.click(trigger);
    const dialog = await screen.findByRole("dialog", { name: "Filters" });
    expect(dialog).toHaveAttribute("aria-describedby");
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    // Tabbing cycles inside the sheet (through Base UI's focus guards); it never reaches the page behind.
    for (let i = 0; i < 6; i++) {
      await user.tab();
      expect(document.activeElement).not.toBe(trigger);
      expect(document.activeElement?.textContent).not.toBe("Outside");
      expect(document.activeElement).not.toBe(document.body);
    }
    await user.click(screen.getByRole("button", { name: "Apply" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it("closes with Escape and with the labelled close button", async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByRole("button", { name: "Filters" }));
    await screen.findByRole("dialog");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Filters" }));
    await user.click(await screen.findByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("makes the page behind inert while open", async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByRole("button", { name: "Filters" }));
    await screen.findByRole("dialog");
    expect(screen.queryByRole("button", { name: "Outside" })).toBeNull();
  });

  it.each([
    ["right", "right"],
    ["left", "left"],
    ["bottom", "down"],
    ["top", "up"],
  ] as const)("side %s swipes %s to dismiss", async (side, direction) => {
    const user = userEvent.setup();
    render(<Example side={side} />);
    await user.click(screen.getByRole("button", { name: "Filters" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveAttribute("data-side", side);
    expect(dialog).toHaveAttribute("data-swipe-direction", direction);
    expect(dialog.className).toContain("sheet");
  });

  it("slides only with motion; reduced motion fades instead", () => {
    const css = themeCss();
    const sheet = css.slice(css.indexOf("@utility sheet {"), css.indexOf("@utility sheet-content"));
    expect(sheet).toContain("transform: translateX(100%)");
    expect(sheet).toMatch(/prefers-reduced-motion: reduce\) \{\s+&:is\(\[data-starting-style\], \[data-ending-style\]\)\[data-swipe-direction\] \{\s+transform: none;\s+opacity: 0;/);
    expect(sheet).toContain("--drawer-swipe-strength");
  });

  it("reads the close label from the locale and has no accessibility violations", async () => {
    const user = userEvent.setup();
    const { baseElement } = render(
      <LocaleProvider locale="pt-BR" messages={ptBR}>
        <Example />
      </LocaleProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Filters" }));
    expect(await screen.findByRole("button", { name: "Fechar" })).toBeInTheDocument();
    expect(await violations(baseElement)).toEqual([]);
  });
});
