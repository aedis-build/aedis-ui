import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import fc from "fast-check";

import { isExternal } from "@/lib/untrusted";
import { LocaleProvider } from "@/registry/aedis/lib/locale";
import { es } from "@/registry/aedis/lib/locales/es";
import { Link, linkProps } from "@/registry/aedis/ui/link";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/registry/aedis/ui/navigation-menu";
import { violations } from "./a11y";

function Nav() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Product</NavigationMenuTrigger>
          <NavigationMenuContent>
            <NavigationMenuLink href="/docs/approval-card">Approvals</NavigationMenuLink>
            <NavigationMenuLink href="javascript:alert(1)">Evil</NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem active>
          <NavigationMenuLink href="/docs" active>Docs</NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="https://github.com/aedis-build/aedis-ui">GitHub</NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

const indicator = (c: HTMLElement) => c.querySelector<HTMLElement>("[data-slot=navigation-menu-indicator]")!;

describe("link", () => {
  it("keeps safe URLs, refuses dangerous ones and isolates external sites", () => {
    expect(linkProps("/docs")).toEqual({ href: "/docs", external: false, rel: undefined });
    expect(linkProps("https://example.com/x")).toEqual({ href: "https://example.com/x", external: true, rel: "noopener noreferrer" });
    expect(linkProps(`${window.location.origin}/same`)).toMatchObject({ external: false });
    expect(linkProps("javascript:alert(1)").href).toBeNull();
    expect(linkProps("data:text/html,x").href).toBeNull();
  });

  it("never yields a link with a dangerous protocol (property)", () => {
    fc.assert(
      fc.property(fc.string(), (href) => {
        const { href: out } = linkProps(href);
        if (out !== null) expect(out.startsWith("/") || out.startsWith("#") || /^(https?|mailto):/i.test(out)).toBe(true);
      }),
    );
  });

  it("isExternal is false for relative and malformed URLs", () => {
    expect(isExternal("/a")).toBe(false);
    expect(isExternal("https://[")).toBe(false);
  });

  it("renders the text without a link when the URL is refused, and marks external links", () => {
    render(
      <>
        <Link href="javascript:alert(1)">Evil</Link>
        <Link href="https://example.com">Example</Link>
      </>,
    );
    expect(screen.queryByRole("link", { name: /Evil/ })).toBeNull();
    expect(screen.getByText("Evil")).toBeInTheDocument();
    const ext = screen.getByRole("link", { name: "Example (external site)" });
    expect(ext).toHaveAttribute("rel", "noopener noreferrer");
  });
});

describe("NavigationMenu", () => {
  it("is a labelled landmark whose indicator rests on the current section", async () => {
    const { container } = render(<Nav />);
    expect(screen.getByRole("navigation", { name: "Site navigation" })).toBeInTheDocument();
    await waitFor(() => expect(indicator(container).style.opacity).toBe("1"));
    expect(indicator(container)).toHaveAttribute("aria-hidden", "true");
    expect(indicator(container).className).toContain("motion-reduce:transition-none");
    expect(screen.getByRole("link", { name: "Docs" })).toHaveAttribute("aria-current", "page");
  });

  it("opens from the keyboard, keeps links safe and closes with Escape back on the trigger", async () => {
    const user = userEvent.setup();
    render(<Nav />);
    await user.tab();
    const trigger = screen.getByRole("button", { name: "Product" });
    expect(trigger).toHaveFocus();
    await user.keyboard("{Enter}");
    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "true"));
    expect(screen.getByRole("link", { name: "Approvals" })).toHaveAttribute("href", "/docs/approval-card");
    expect(screen.queryByRole("link", { name: "Evil" })).toBeNull();
    expect(screen.getByText("Evil").closest("a")).toBeNull();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "false"));
    expect(trigger).toHaveFocus();
  });

  it("marks external links and isolates them", () => {
    render(<Nav />);
    expect(screen.getByRole("link", { name: "GitHub (external site)" })).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("hides the indicator when nothing is open or current", () => {
    const { container } = render(
      <NavigationMenu aria-label="Docs">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink href="/a">A</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>,
    );
    expect(screen.getByRole("navigation", { name: "Docs" })).toBeInTheDocument();
    expect(indicator(container).style.opacity).toBe("0");
  });

  it("reads labels from the locale and has no accessibility violations", async () => {
    const { container } = render(
      <LocaleProvider locale="es" messages={es}>
        <Nav />
      </LocaleProvider>,
    );
    expect(screen.getByRole("navigation", { name: "Navegación del sitio" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "GitHub (sitio externo)" })).toBeInTheDocument();
    expect(await violations(container)).toEqual([]);
  });
});
