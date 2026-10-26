import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { STORAGE_KEY, ThemeEditor } from "@/components/site/theme-editor";
import { colors } from "@/registry/aedis/lib/tokens";
import { violations } from "./a11y";

const preview = () => screen.getByTestId("theme-preview");

describe("ThemeEditor", () => {
  beforeEach(() => window.localStorage.clear());

  it("previews a valid change over real components and saves it", async () => {
    render(<ThemeEditor />);
    fireEvent.change(screen.getByLabelText("primary"), { target: { value: "#0b6e4f" } });
    await waitFor(() => expect(preview().style.getPropertyValue("--primary")).toBe("#0b6e4f"));
    expect(screen.getAllByRole("status")[0]).toHaveTextContent("Passes contrast AA");
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)!).colors.light.primary).toBe("#0b6e4f");
  });

  it("refuses an unreadable change and keeps the last valid theme", async () => {
    render(<ThemeEditor />);
    fireEvent.change(screen.getByLabelText("foreground"), { target: { value: "#f6f7f9" } });
    expect(await screen.findByText(/foreground on background is 1.00:1/)).toBeInTheDocument();
    expect(preview().style.getPropertyValue("--foreground")).toBe(colors.foreground.light);
  });

  it("starts from the brand palette and back", async () => {
    const user = userEvent.setup();
    render(<ThemeEditor />);
    await user.click(screen.getByRole("button", { name: "Brand" }));
    await waitFor(() => expect(preview().style.getPropertyValue("--background")).toBe(colors.background.brand));
    expect(screen.getAllByRole("status")[0]).toHaveTextContent("Passes contrast AA");
    await user.click(screen.getByRole("button", { name: "Light and dark" }));
    await waitFor(() => expect(preview().style.getPropertyValue("--background")).toBe(colors.background.light));
  });

  it("edits dark separately", async () => {
    const user = userEvent.setup();
    render(<ThemeEditor />);
    await user.click(screen.getByRole("tab", { name: "Dark" }));
    await waitFor(() => expect(preview().style.getPropertyValue("--background")).toBe(colors.background.dark));
    expect(preview().style.getPropertyValue("color-scheme")).toBe("dark");
  });

  it("imports a JSON theme and reports why a malicious one is refused", async () => {
    const user = userEvent.setup();
    render(<ThemeEditor />);
    const field = screen.getByLabelText("Import");
    fireEvent.change(field, { target: { value: JSON.stringify({ version: 1, name: "x", colors: { light: { primary: "url(https://evil/x)" }, dark: {} } }) } });
    await user.click(screen.getByRole("button", { name: "Import theme" }));
    expect(screen.getByRole("alert")).toHaveTextContent("colors.light.primary must be a hex color or oklch()");

    fireEvent.change(field, { target: { value: JSON.stringify({ version: 1, name: "Acme", colors: { light: { accent: "#0b6e4f" }, dark: {} } }) } });
    await user.click(screen.getByRole("button", { name: "Import theme" }));
    await waitFor(() => expect(preview().style.getPropertyValue("--accent")).toBe("#0b6e4f"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveValue("Acme");
    expect((screen.getByLabelText("Export") as HTMLTextAreaElement).value).toContain('"accent": "#0b6e4f"');
  });

  it("validates a stored theme again on load and ignores a tampered one", async () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, name: "t", colors: { light: { primary: "#000; } body { display: none" }, dark: {} } }));
    render(<ThemeEditor />);
    await waitFor(() => expect(preview().style.getPropertyValue("--primary")).toBe(colors.primary.light));
    expect(screen.getByLabelText("Name")).toHaveValue("My theme");
  });

  it("loads a valid stored theme", async () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, name: "Saved", colors: { light: {}, dark: {} }, font: "serif" }));
    render(<ThemeEditor />);
    await waitFor(() => expect(screen.getByLabelText("Name")).toHaveValue("Saved"));
    expect(preview().style.getPropertyValue("--font-sans")).toContain("ui-serif");
  });

  it("exports a download and has no accessibility violations", async () => {
    const user = userEvent.setup();
    const createObjectURL = vi.fn(() => "blob:theme");
    Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const { container } = render(<ThemeEditor />);
    await user.click(screen.getByRole("button", { name: "Download JSON" }));
    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(await violations(container)).toEqual([]);
  });
});
