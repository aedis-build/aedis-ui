import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import fc from "fast-check";

import { CopyButton } from "@/registry/aedis/ui/copy-button";
import { violations } from "./a11y";

function clipboard(writeText: (text: string) => Promise<void>) {
  const readText = vi.fn();
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: vi.fn(writeText), readText } });
  return navigator.clipboard as unknown as { writeText: ReturnType<typeof vi.fn>; readText: ReturnType<typeof vi.fn> };
}

afterEach(() => {
  vi.useRealTimers();
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
});

describe("copy button (#198)", () => {
  it("copies exactly the value, says Copied politely for 2 s, and never reads the clipboard", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const cb = clipboard(async () => {});
    const { container } = render(<CopyButton value="https://rlfn.studio/p/ana">Copy link</CopyButton>);
    expect(await violations(container)).toEqual([]);
    await user.click(screen.getByRole("button", { name: "Copy link" }));
    expect(cb.writeText).toHaveBeenCalledWith("https://rlfn.studio/p/ana");
    expect(cb.readText).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Copied");
    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(screen.getByRole("button", { name: "Copy link" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("");
  });

  it("falls back to the text selected beside it when the browser refuses", async () => {
    const user = userEvent.setup();
    clipboard(() => Promise.reject(new DOMException("denied", "NotAllowedError")));
    const { container } = render(<CopyButton value="https://rlfn.studio/p/ana" />);
    await user.click(screen.getByRole("button", { name: "Copy" }));
    const field = await screen.findByRole("textbox", { name: /press Ctrl\+C/ });
    expect(field).toHaveValue("https://rlfn.studio/p/ana");
    expect(field).toHaveFocus();
    expect(field).toHaveAttribute("readonly");
    expect([(field as HTMLInputElement).selectionStart, (field as HTMLInputElement).selectionEnd]).toEqual([0, 25]);
    expect(screen.getByRole("status")).toHaveTextContent(/selected/);
    expect(await violations(container)).toEqual([]);
  });

  it("falls back too where there is no Clipboard API at all", async () => {
    const user = userEvent.setup();
    // After setup: user-event installs a clipboard stub of its own.
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
    render(<CopyButton value="abc" size="icon" />);
    await user.click(screen.getByRole("button", { name: "Copy" }));
    expect(await screen.findByRole("textbox")).toHaveValue("abc");
  });

  it("hands the clipboard any string unchanged (property)", async () => {
    await fc.assert(
      fc.asyncProperty(fc.string({ maxLength: 200 }), async (value) => {
        const user = userEvent.setup();
        const cb = clipboard(async () => {});
        const { unmount } = render(<CopyButton value={value} />);
        await user.click(screen.getByRole("button", { name: "Copy" }));
        expect(cb.writeText).toHaveBeenCalledWith(value);
        unmount();
      }),
      { numRuns: 25 },
    );
  });
});
