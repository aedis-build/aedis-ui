import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SiteSearch } from "@/components/site/site-search";
import { LocaleProvider } from "@/registry/aedis/lib/locale";
import { es } from "@/registry/aedis/lib/locales/es";
import { Command, CommandDialog, filterCommandItems, type CommandItem } from "@/registry/aedis/ui/command";
import { violations } from "./a11y";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const items: CommandItem[] = [
  { value: "/docs/button", label: "Button", description: "Actions people take", group: "Actions" },
  { value: "/docs/dialog", label: "Dialog", description: "Modal for forms; use a button to open", group: "Overlays" },
  { value: "/docs/table", label: "Table", group: "Data display" },
  { value: "/x", label: "<img src=x onerror=alert(1)>" },
];

const options = () => screen.getAllByRole("option").map((o) => o.firstChild?.textContent);

describe("filterCommandItems", () => {
  it("needs every word and puts label matches first", () => {
    expect(filterCommandItems(items, "").length).toBe(4);
    expect(filterCommandItems(items, "button").map((i) => i.label)).toEqual(["Button", "Dialog"]);
    expect(filterCommandItems(items, "MODAL  forms").map((i) => i.label)).toEqual(["Dialog"]);
    expect(filterCommandItems(items, "data")).toEqual([items[2]]);
    expect(filterCommandItems(items, "nothing")).toEqual([]);
  });
});

describe("Command", () => {
  it("filters as you type, moves with the arrows and chooses with Enter", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Command items={items} onSelect={onSelect} />);
    const box = screen.getByRole("combobox", { name: "Search" });
    expect(options()).toEqual(["Button", "Dialog", "Table", "<img src=x onerror=alert(1)>"]);
    expect(document.querySelector("img")).toBeNull();

    await user.type(box, "o");
    expect(options()).toEqual(["Button", "Dialog", "<img src=x onerror=alert(1)>"]);
    expect(screen.getByRole("option", { name: /Button/ })).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{ArrowDown}");
    expect(box.getAttribute("aria-activedescendant")).toBe(screen.getByRole("option", { name: /Dialog/ }).id);
    await user.keyboard("{ArrowUp}{ArrowUp}");
    expect(screen.getByRole("option", { name: /onerror/ })).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("option", { name: /Button/ })).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{End}");
    expect(screen.getByRole("option", { name: /onerror/ })).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{Home}{Enter}");
    expect(onSelect).toHaveBeenCalledWith(items[0]);

    await user.hover(screen.getByRole("option", { name: /Dialog/ }));
    await user.click(screen.getByRole("option", { name: /Dialog/ }));
    expect(onSelect).toHaveBeenLastCalledWith(items[1]);
  });

  it("says when nothing matches, ignores Enter then and bounds the query", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Command items={items} onSelect={onSelect} />);
    // The live region exists before it has anything to say, so the change is announced (#158).
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("");
    await user.type(screen.getByRole("combobox"), "zzz{Enter}{ArrowDown}");
    expect(screen.getByRole("status")).toBe(status);
    expect(screen.getByRole("status")).toHaveTextContent("No results.");
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByRole("combobox")).toHaveAttribute("maxLength", "256");
    expect(screen.getByRole("combobox")).not.toHaveAttribute("aria-activedescendant");
  });

  it("groups options under their category and has no accessibility violations", async () => {
    const { container } = render(<Command items={items} onSelect={() => {}} />);
    expect(screen.getByRole("group", { name: "Overlays" })).toContainElement(screen.getByRole("option", { name: /Dialog/ }));
    expect(await violations(container)).toEqual([]);
  });

  it("reads its labels from the locale", () => {
    render(<LocaleProvider locale="es" messages={es}><Command items={[]} onSelect={() => {}} /></LocaleProvider>);
    expect(screen.getByRole("combobox", { name: "Buscar" })).toHaveAttribute("placeholder", "Buscar…");
    expect(screen.getByRole("status")).toHaveTextContent("Sin resultados.");
  });
});

describe("CommandDialog", () => {
  it("opens as a labelled modal with focus in the field", async () => {
    render(<CommandDialog open onOpenChange={() => {}} items={items} onSelect={() => {}} labels={{ label: "Go to" }} />);
    const dialog = await screen.findByRole("dialog", { name: "Go to" });
    expect(dialog).toContainElement(screen.getByRole("combobox", { name: "Go to" }));
    await waitFor(() => expect(screen.getByRole("combobox")).toHaveFocus());
  });
});

describe("SiteSearch", () => {
  it("opens with ⌘K or Ctrl+K and goes to the chosen page", async () => {
    const user = userEvent.setup();
    render(<SiteSearch items={items} />);
    await user.keyboard("{Control>}k{/Control}");
    await user.type(await screen.findByRole("combobox", { name: "Search components and docs" }), "table{Enter}");
    expect(push).toHaveBeenCalledWith("/docs/table");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /Search components and docs/ }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    await user.keyboard("{Meta>}k{/Meta}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
