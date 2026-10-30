import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LocaleProvider } from "@/registry/aedis/lib/locale";
import { es } from "@/registry/aedis/lib/locales/es";
import { ptBR } from "@/registry/aedis/lib/locales/pt-br";
import { Button } from "@/registry/aedis/ui/button";
import { SiteFooter } from "@/registry/aedis/ui/site-footer";
import { SiteHeader, type SiteHeaderItem } from "@/registry/aedis/ui/site-header";
import { violations } from "./a11y";

const items: SiteHeaderItem[] = [
  { label: "Docs", href: "/docs", active: true },
  { label: "Pricing", href: "/pricing" },
  { label: "Evil", href: "javascript:alert(1)" },
  { label: "Blog", href: "https://blog.example.com" },
];

function Header() {
  return <SiteHeader brand="Aedis" items={items} actions={<Button>Get started</Button>} />;
}

const desktopNav = () => screen.getByRole("navigation", { name: "Site navigation" });

describe("SiteHeader", () => {
  it("is a sticky banner whose brand links home, named by its own text (WCAG 2.5.3, #239)", () => {
    const { container } = render(<Header />);
    const header = screen.getByRole("banner");
    expect(header.className).toContain("sticky");
    expect(header.className).toContain("material-regular");
    expect(header.className).toContain("scroll-edge");
    const home = screen.getByRole("link", { name: "Aedis" });
    expect(home).toHaveAttribute("href", "/");
    expect(home).not.toHaveAttribute("aria-label");
    expect(container.querySelector("[data-slot=navigation-menu]")!.className).toContain("md:flex");
  });

  it("keeps hrefs safe, isolates external items and marks the current one", () => {
    render(<SiteHeader brand="Aedis" homeHref="/en" items={items} />);
    const nav = within(desktopNav());
    expect(screen.getByRole("link", { name: "Aedis" })).toHaveAttribute("href", "/en");
    expect(nav.getByRole("link", { name: "Docs" })).toHaveAttribute("aria-current", "page");
    expect(nav.getByRole("link", { name: "Docs" }).closest("li")).toHaveAttribute("data-active");
    expect(nav.getByRole("link", { name: "Pricing" })).not.toHaveAttribute("aria-current");
    expect(nav.queryByRole("link", { name: "Evil" })).toBeNull();
    expect(nav.getByText("Evil").closest("a")).toBeNull();
    expect(nav.getByRole("link", { name: "Blog (external site)" })).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("on small screens opens a sheet with the same items and actions, and closes when a link is followed", async () => {
    const user = userEvent.setup();
    render(<Header />);
    const trigger = screen.getByRole("button", { name: "Menu" });
    expect(trigger.className).toContain("md:hidden");
    await user.click(trigger);
    const dialog = await screen.findByRole("dialog", { name: "Menu" });
    const sheet = within(within(dialog).getByRole("navigation", { name: "Menu" }));
    expect(sheet.getAllByRole("listitem").map((li) => li.textContent)).toEqual(["Docs", "Pricing", "Evil", "Blog (external site)"]);
    expect(sheet.getByRole("link", { name: "Docs" })).toHaveAttribute("aria-current", "page");
    expect(sheet.getByRole("link", { name: "Pricing" })).not.toHaveAttribute("aria-current");
    expect(sheet.queryByRole("link", { name: "Evil" })).toBeNull();
    expect(sheet.getByRole("link", { name: "Blog (external site)" })).toHaveAttribute("rel", "noopener noreferrer");
    expect(within(dialog).getByRole("button", { name: "Get started" })).toBeInTheDocument();

    await user.click(sheet.getByRole("link", { name: "Pricing" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    await user.click(trigger);
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Get started" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("reads labels from the locale and has no accessibility violations, closed or open", async () => {
    const user = userEvent.setup();
    const { baseElement } = render(
      <LocaleProvider locale="pt-BR" messages={ptBR}>
        <Header />
      </LocaleProvider>,
    );
    expect(screen.getByRole("button", { name: "Menu" })).toBeInTheDocument();
    expect(await violations(baseElement)).toEqual([]);
    await user.click(screen.getByRole("button", { name: "Menu" }));
    await screen.findByRole("dialog", { name: "Menu" });
    expect(await violations(baseElement)).toEqual([]);
  });

  it("names a logo-only brand from the locale, accepts label overrides and works without actions", () => {
    const { unmount } = render(<LocaleProvider locale="pt-BR" messages={ptBR}><SiteHeader brand={<svg aria-hidden="true" />} items={[]} /></LocaleProvider>);
    expect(screen.getByRole("link", { name: "Início" })).toBeInTheDocument();
    unmount();
    render(<SiteHeader brand={<svg aria-hidden="true" />} items={[]} labels={{ home: "Aedis home", menu: "Open menu" }} />);
    expect(screen.getByRole("link", { name: "Aedis home" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open menu" })).toBeInTheDocument();
  });
});

describe("SiteFooter", () => {
  it("renders safe links in a labelled navigation with the notes", () => {
    render(
      <SiteFooter
        links={[
          { label: "Docs", href: "/docs" },
          { label: "GitHub", href: "https://github.com/aedis-build/aedis-ui" },
          { label: "Evil", href: "javascript:alert(1)" },
        ]}
      >
        MIT licensed.
      </SiteFooter>,
    );
    const footer = screen.getByRole("contentinfo");
    expect(footer.className).toContain("border-t");
    expect(footer).toHaveTextContent("MIT licensed.");
    const nav = within(screen.getByRole("navigation", { name: "Footer" }));
    expect(nav.getByRole("link", { name: "Docs" })).toHaveAttribute("href", "/docs");
    expect(nav.getByRole("link", { name: "GitHub (external site)" })).toHaveAttribute("rel", "noopener noreferrer");
    expect(nav.queryByRole("link", { name: "Evil" })).toBeNull();
    expect(nav.getByText("Evil").closest("a")).toBeNull();
  });

  it("omits empty parts, reads labels from the locale and has no accessibility violations", async () => {
    const { container, rerender } = render(<SiteFooter links={[]} />);
    expect(screen.queryByRole("navigation")).toBeNull();
    expect(container.querySelector("[data-slot=site-footer-notes]")).toBeNull();
    rerender(
      <LocaleProvider locale="es" messages={es}>
        <SiteFooter links={[{ label: "Docs", href: "/docs" }]} labels={{}}>
          Licencia MIT.
        </SiteFooter>
      </LocaleProvider>,
    );
    expect(screen.getByRole("navigation", { name: "Pie de página" })).toBeInTheDocument();
    expect(await violations(container)).toEqual([]);
  });
});
