import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LocaleProvider } from "@/registry/aedis/lib/locale";
import { ptBR } from "@/registry/aedis/lib/locales/pt-br";
import { SectionDock } from "@/registry/aedis/ui/section-dock";
import { violations } from "./a11y";

// Sections at document positions 0, 1000 and 3000; the page is 5000 px in an 800 px viewport.
function Page({ children }: { children: React.ReactNode }) {
  return (
    <>
      <section id="one" data-chapter="Opening" />
      <section id="two" data-chapter="Work" />
      <section id="three" data-chapter="Contact" />
      <section id="unlabelled" />
      {children}
    </>
  );
}
const tops: Record<string, number> = { one: 0, two: 1000, three: 3000 };
function scrollTo(y: number) {
  act(() => {
    Object.defineProperty(window, "scrollY", { configurable: true, value: y });
    for (const [id, top] of Object.entries(tops)) document.getElementById(id)!.getBoundingClientRect = () => ({ top: top - y, height: 100 }) as DOMRect;
    document.documentElement.getBoundingClientRect = () => ({ top: -y, height: 5000 }) as DOMRect;
    window.dispatchEvent(new Event("scroll"));
    vi.runOnlyPendingTimers();
  });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame"] });
  Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });
});
afterEach(() => vi.useRealTimers());

const ring = () => screen.getByRole("button", { name: /^Page sections/ });

describe("section dock (#246)", () => {
  it("reads the chapters, fills the ring with the page's progress and names the current section by position", () => {
    render(<Page><SectionDock /></Page>);
    scrollTo(0);
    expect(ring()).toHaveAccessibleName("Page sections, now: Opening");
    scrollTo(2100);
    // 2100 + 400 is past "Work" (1000) and short of "three" (3000).
    expect(ring()).toHaveAccessibleName("Page sections, now: Work");
    expect(document.querySelector("[data-slot=section-dock-ring]")).toHaveStyle({ strokeDashoffset: String(1 - 2100 / 4200) });
    scrollTo(2700);
    expect(ring()).toHaveAccessibleName("Page sections, now: Contact");
    // Only elements with both an id and a data-chapter are sections.
    expect(document.querySelectorAll("[data-slot=section-dock] li")).toHaveLength(0);
  });

  it("opens on hover, keyboard focus and a tap, with read, current and next sections, and closes on Escape", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { container } = render(<Page><SectionDock action={{ label: "Talk to us", href: "/contact" }} /></Page>);
    scrollTo(2100);
    expect(screen.queryByRole("link")).toBeNull();
    const nav = screen.getByRole("navigation", { name: "Page sections" });
    fireEvent.pointerEnter(nav, { pointerType: "touch" });
    expect(ring()).toHaveAttribute("aria-expanded", "false");
    fireEvent.pointerEnter(nav, { pointerType: "mouse" });
    expect(ring()).toHaveAttribute("aria-expanded", "true");
    fireEvent.pointerLeave(nav);
    expect(ring()).toHaveAttribute("aria-expanded", "false");

    await user.tab();
    expect(ring()).toHaveFocus();
    expect(ring()).toHaveAttribute("aria-expanded", "true");
    const panel = within(nav);
    expect(panel.getByRole("link", { name: "Opening, read" })).toHaveAttribute("href", "#one");
    expect(panel.getByRole("link", { name: "Work, you are here" })).toHaveAttribute("aria-current", "location");
    expect(panel.getByRole("link", { name: "Contact, next" })).not.toHaveAttribute("aria-current");
    expect(panel.getAllByRole("listitem")).toHaveLength(3);
    expect(panel.getByRole("link", { name: "Talk to us" })).toHaveAttribute("href", "/contact");
    expect(await violations(container)).toEqual([]);
    await user.tab();
    expect(panel.getByRole("link", { name: "Opening, read" })).toHaveFocus();
    await user.keyboard("{Escape}");
    // Closed, with the focus back on the ring, until it leaves the dock.
    expect(screen.queryByRole("link")).toBeNull();
    expect(ring()).toHaveFocus();
    await user.click(document.body);

    await user.click(ring());
    expect(ring()).toHaveAttribute("aria-expanded", "true");
    await user.click(screen.getByRole("link", { name: "Work, you are here" }));
    fireEvent.blur(ring());
    expect(screen.queryByRole("link", { name: "Talk to us" })).toBeNull();
  });

  it("drops an action whose href is not safe, and links each section to its id", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<SectionDock sections={[{ id: "a", label: "Alpha" }]} action={{ label: "Run", href: "javascript:alert(1)" }} />);
    await user.click(ring());
    expect(screen.getByRole("link", { name: /Alpha/ })).toHaveAttribute("href", "#a");
    expect(screen.queryByRole("link", { name: "Run" })).toBeNull();
    expect(document.querySelector("a[href^='javascript']")).toBeNull();
  });

  it("sits in the corner it is given and reads its labels from the locale", () => {
    render(
      <LocaleProvider locale="pt-BR" messages={ptBR}>
        <SectionDock sections={[]} placement="bottom-left" />
      </LocaleProvider>,
    );
    const nav = screen.getByRole("navigation", { name: "Seções da página" });
    expect(nav.className).toContain("left-3");
    expect(screen.getByRole("button", { name: "Seções da página" })).toBeInTheDocument();
  });
});
