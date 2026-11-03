import { act, render, screen, waitFor, within } from "@testing-library/react";
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

describe("SiteFooter curtain, backdrop, closing and credits (#247)", () => {
  function reducedMotion(on: boolean) {
    window.matchMedia = ((q: string) => ({ matches: on && q.includes("reduce"), addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
  }
  afterEach(() => {
    reducedMotion(false);
    vi.restoreAllMocks();
  });

  function Rich({ reveal = false }: { reveal?: boolean }) {
    return (
      <div>
        <main className="relative z-10 bg-surface">Page</main>
        <SiteFooter
          reveal={reveal}
          links={[{ label: "Work", href: "/work" }]}
          backdrop={<p>RLFN RLFN RLFN</p>}
          closing={<a href="/contact">Talk to us</a>}
          credits={{ left: "© 2026 RLFN", right: "Photos: the studio", center: "Built by RLFN Tech" }}
        />
      </div>
    );
  }

  it("keeps the backdrop decorative, and the closing action and credits in the page after the links", async () => {
    const { container } = render(<Rich />);
    const footer = screen.getByRole("contentinfo");
    expect(container.querySelector("[data-slot=site-footer-backdrop]")).toHaveAttribute("aria-hidden", "true");
    expect(within(footer).getByRole("link", { name: "Talk to us" })).toHaveAttribute("href", "/contact");
    expect(container.querySelector("[data-slot=site-footer-credits]")).toHaveTextContent("© 2026 RLFNPhotos: the studioBuilt by RLFN Tech");
    expect(footer).not.toHaveAttribute("data-reveal");
    expect(await violations(container)).toEqual([]);
  });

  it("is a curtain only where it fits its viewport, and never under reduced motion", () => {
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });
    const height = vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(700);
    vi.spyOn(window, "getComputedStyle").mockReturnValue({ overflowY: "visible", position: "relative", zIndex: "10", backgroundColor: "rgb(255, 255, 255)", backgroundImage: "none" } as CSSStyleDeclaration);
    const { unmount } = render(<Rich reveal />);
    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-reveal", "true");
    expect(footer.className).toContain("sticky");
    unmount();

    height.mockReturnValue(900);
    const { unmount: tall } = render(<Rich reveal />);
    expect(screen.getByRole("contentinfo")).not.toHaveAttribute("data-reveal");
    tall();

    height.mockReturnValue(700);
    reducedMotion(true);
    render(<Rich reveal />);
    expect(screen.getByRole("contentinfo")).not.toHaveAttribute("data-reveal");
  });

  it("uncovers itself when the focus lands in it, so a focused link is never hidden under the page (WCAG 2.4.11)", () => {
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(700);
    Object.defineProperty(document.documentElement, "scrollHeight", { configurable: true, value: 3000 });
    const scrollTo = vi.fn();
    window.scrollTo = scrollTo as unknown as typeof window.scrollTo;
    render(<Rich reveal />);
    expect(screen.getByRole("contentinfo")).toHaveAttribute("data-reveal", "true");
    act(() => screen.getByRole("link", { name: "Work" }).focus());
    expect(scrollTo).toHaveBeenCalledWith(0, 3000);
  });

  it("warns in development when the page before it would let it show through", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(100);
    render(
      <div>
        <main>Not stacked above</main>
        <SiteFooter reveal links={[]} />
      </div>,
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("position relative, a z-index above 0 and an opaque background"));
  });

  it("measures against the box it scrolls in, when there is one", () => {
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(500);
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(400);
    const real = window.getComputedStyle;
    vi.spyOn(window, "getComputedStyle").mockImplementation((el) => (el instanceof HTMLElement && "box" in el.dataset ? ({ overflowY: "auto" } as CSSStyleDeclaration) : real(el)));
    render(
      <div data-box="">
        <main className="relative z-10 bg-surface">Page</main>
        <SiteFooter reveal links={[]} closing="Bye" />
      </div>,
    );
    // 500 px of footer in a 400 px box: a normal footer.
    expect(screen.getByRole("contentinfo")).not.toHaveAttribute("data-reveal");
  });
});
