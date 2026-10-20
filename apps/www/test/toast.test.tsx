import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LocaleProvider } from "@/registry/aedis/lib/locale";
import { ptBR } from "@/registry/aedis/lib/locales/pt-br";
import { themeCss } from "@/registry/aedis/lib/theme-css";
import { Toaster, toast, toastManager, useToast } from "@/registry/aedis/ui/toast";
import { violations } from "./a11y";

afterEach(() => vi.useRealTimers());

function Failing() {
  const t = useToast();
  return (
    <button type="button" onClick={() => t.failed({ description: "Nothing was sent." })}>
      Send
    </button>
  );
}

describe("Toast", () => {
  it("shows text, never markup, and strips hidden characters", async () => {
    render(<Toaster />);
    act(() => void toast.success("Saved\u200B", { description: "<img src=x onerror=alert(1)>" }));
    const viewport = await screen.findByRole("region", { name: "Notifications" });
    expect(await screen.findByText("Saved")).toBeInTheDocument();
    expect(screen.getByText("<img src=x onerror=alert(1)>")).toBeInTheDocument();
    expect(viewport.querySelector("img")).toBeNull();
  });

  it("announces errors urgently and everything else politely", () => {
    const add = vi.spyOn(toastManager, "add");
    toast.error("Could not save");
    toast.info("Copied");
    toast.warning("Almost at the ceiling");
    toast.show("Plain");
    expect(add.mock.calls.map(([o]) => [o.type, o.priority])).toEqual([
      ["error", "high"],
      ["info", "low"],
      ["warning", "low"],
      [undefined, "low"],
    ]);
    add.mockRestore();
  });

  it("uses the generic dictionary message for failures, never the server's text", async () => {
    const user = userEvent.setup();
    render(
      <LocaleProvider locale="pt-BR" messages={ptBR}>
        <Toaster>
          <Failing />
        </Toaster>
      </LocaleProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Send" }));
    // Shown in the toast and announced urgently by Base UI's live region.
    expect((await screen.findAllByText("Algo deu errado. Tente de novo.")).length).toBeGreaterThanOrEqual(1);
    // Errors are announced through Base UI's role="alert" region; the visual toast is hidden from the tree meanwhile.
    expect(await screen.findByRole("alert")).toHaveTextContent("Algo deu errado. Tente de novo.Nothing was sent.");
    await waitFor(() => expect(document.querySelector("[data-slot=toast-close]")).toHaveAttribute("aria-label", "Fechar notificação"));
  });

  it("closes from its close button and runs an action", async () => {
    const user = userEvent.setup();
    const onUndo = vi.fn();
    render(<Toaster />);
    act(() => void toast.show("Archived", { action: { label: "Undo", onClick: onUndo } }));
    await user.click(await screen.findByRole("button", { name: "Undo" }));
    expect(onUndo).toHaveBeenCalledOnce();
    act(() => void toast.show("Second"));
    await user.click((await screen.findAllByRole("button", { name: "Close notification" }))[0]);
    await waitFor(() => expect(screen.getAllByRole("button", { name: "Close notification" }).length).toBeLessThanOrEqual(2));
  });

  it("pauses while hovered and closes after its timeout otherwise", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<Toaster />);
    act(() => void toast.info("Copied", { timeout: 1000 }));
    const viewport = await screen.findByRole("region", { name: "Notifications" });
    await screen.findByText("Copied");
    fireEvent.mouseEnter(viewport);
    fireEvent.pointerEnter(viewport);
    await act(() => vi.advanceTimersByTimeAsync(3000));
    expect(screen.getByText("Copied")).toBeInTheDocument();
    fireEvent.mouseLeave(viewport);
    fireEvent.pointerLeave(viewport);
    await act(() => vi.advanceTimersByTimeAsync(3000));
    await waitFor(() => expect(screen.queryByText("Copied")).not.toBeInTheDocument());
  });

  it("dismisses by id", async () => {
    render(<Toaster />);
    let id = "";
    act(() => void (id = toast.show("Uploading")));
    await screen.findByText("Uploading");
    act(() => toast.dismiss(id));
    await waitFor(() => expect(screen.queryByText("Uploading")).not.toBeInTheDocument());
  });

  it("stacks with the spring, exits fast and appears in place under reduced motion", () => {
    const css = themeCss();
    const block = css.slice(css.indexOf("@utility toast {"), css.indexOf("/* Line-by-line reveal"));
    expect(block).toContain("transform var(--duration-spring) var(--ease-spring-critical)");
    expect(block).toMatch(/\[data-ending-style\] \{\s+transition-duration: var\(--duration-fast\)/);
    expect(block).toMatch(/prefers-reduced-motion: reduce\) \{\s+&:is\(\[data-starting-style\], \[data-ending-style\]\) \{\s+transform: none;\s+opacity: 0;/);
  });

  it("has no accessibility violations", async () => {
    render(<Toaster />);
    act(() => void toast.success("Saved", { description: "Your draft is safe." }));
    const viewport = await screen.findByRole("region", { name: "Notifications" });
    await screen.findByText("Saved");
    expect(await violations(viewport)).toEqual([]);
  });
});
