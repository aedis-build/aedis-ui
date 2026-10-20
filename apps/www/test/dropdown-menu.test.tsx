import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LocaleProvider } from "@/registry/aedis/lib/locale";
import { ptBR } from "@/registry/aedis/lib/locales/pt-br";
import { themeCss } from "@/registry/aedis/lib/theme-css";
import { Button } from "@/registry/aedis/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuLinkItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/registry/aedis/ui/dropdown-menu";
import { violations } from "./a11y";

function Example({ onRename = () => {}, onRevoke = () => {} }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>Session</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuLabel>Session</DropdownMenuLabel>
          <DropdownMenuItem onClick={onRename}>
            Rename <DropdownMenuShortcut>⌘R</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuLinkItem href="/docs/devices">Devices</DropdownMenuLinkItem>
          <DropdownMenuLinkItem href="https://status.example.com">Status</DropdownMenuLinkItem>
          <DropdownMenuLinkItem href="javascript:alert(1)">Evil</DropdownMenuLinkItem>
        </DropdownMenuGroup>
        <DropdownMenuCheckboxItem defaultChecked>Notify me</DropdownMenuCheckboxItem>
        <DropdownMenuRadioGroup defaultValue="eu">
          <DropdownMenuRadioItem value="eu">Europe</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="us">United States</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>Export</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onRevoke} confirm={{ title: "Revoke every session?", description: "Every device signs out." }}>
          Revoke all sessions…
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

async function open() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Session" }));
  await screen.findByRole("menu");
  return user;
}

describe("DropdownMenu", () => {
  it("opens from the keyboard and moves through items with the arrows", async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();
    render(<Example onRename={onRename} />);
    await user.tab();
    await user.keyboard("{ArrowDown}");
    await screen.findByRole("menu");
    await waitFor(() => expect(screen.getByRole("menuitem", { name: /Rename/ })).toHaveFocus());
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Devices" })).toHaveFocus();
    await user.keyboard("{ArrowUp}{Enter}");
    expect(onRename).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Session" })).toHaveFocus();
  });

  it("asks before a destructive action, starting on Cancel, and runs it only on confirm", async () => {
    const onRevoke = vi.fn();
    render(<Example onRevoke={onRevoke} />);
    const user = await open();
    await user.click(screen.getByRole("menuitem", { name: "Revoke all sessions…" }));
    const dialog = await screen.findByRole("alertdialog", { name: "Revoke every session?" });
    expect(dialog).toHaveTextContent("Every device signs out.");
    await waitFor(() => expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus());
    await user.keyboard("{Enter}");
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(onRevoke).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByRole("button", { name: "Session" })).toHaveFocus());

    await user.click(screen.getByRole("button", { name: "Session" }));
    await user.click(await screen.findByRole("menuitem", { name: "Revoke all sessions…" }));
    await user.click(await screen.findByRole("button", { name: "Revoke all sessions" }));
    expect(onRevoke).toHaveBeenCalledOnce();
  });

  it("uses the dictionary when a destructive item gives no text", async () => {
    render(
      <LocaleProvider locale="pt-BR" messages={ptBR}>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button />}>Session</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem variant="destructive">
              <span>Apagar</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </LocaleProvider>,
    );
    const user = await open();
    await user.click(screen.getByRole("menuitem", { name: "Apagar" }));
    expect(await screen.findByRole("alertdialog", { name: "Tem certeza?" })).toHaveTextContent("Não dá para desfazer.");
    expect(screen.getByRole("button", { name: "Continuar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();
  });

  it("keeps link items safe and marks external ones", async () => {
    render(<Example />);
    await open();
    expect(screen.getByRole("menuitem", { name: "Devices" })).toHaveAttribute("href", "/docs/devices");
    const status = screen.getByRole("menuitem", { name: "Status (external site)" });
    expect(status).toHaveAttribute("rel", "noopener noreferrer");
    const evil = screen.getByRole("menuitem", { name: "Evil" });
    expect(evil).not.toHaveAttribute("href");
    expect(evil).toHaveAttribute("aria-disabled", "true");
  });

  it("toggles checkbox and radio items and opens submenus", async () => {
    render(<Example />);
    const user = await open();
    expect(screen.getByRole("menuitemcheckbox", { name: "Notify me" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("menuitemradio", { name: "Europe" })).toHaveAttribute("aria-checked", "true");
    await user.click(screen.getByRole("menuitem", { name: "More" }));
    expect(await screen.findByRole("menuitem", { name: "Export" })).toBeInTheDocument();
  });

  it("materializes from the trigger with a cascade that reduced motion keeps still", async () => {
    render(<Example />);
    await open();
    expect(screen.getByRole("menu").className).toMatch(/materialize.*cascade/);
    const css = themeCss();
    const cascade = css.slice(css.indexOf("@utility cascade"), css.indexOf("@utility fade"));
    expect(cascade).toContain("var(--duration-stagger)");
    expect(cascade).toContain("&:not([data-ending-style])");
    expect(cascade).toMatch(/prefers-reduced-motion: reduce\)[\s\S]*translate: none/);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Example />);
    await open();
    expect(await violations(container)).toEqual([]);
    expect(await violations(screen.getByRole("menu"))).toEqual([]);
  });
});
