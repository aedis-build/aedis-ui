import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import fc from "fast-check";

import { LocaleProvider } from "@/registry/aedis/lib/locale";
import { ptBR } from "@/registry/aedis/lib/locales/pt-br";
import { highlight } from "@/registry/aedis/lib/highlight";
import { CodeBlock } from "@/registry/aedis/ui/code-block";
import { violations } from "./a11y";

let intersect: ((entries: { isIntersecting: boolean }[]) => void) | undefined;
let reduced = false;

beforeEach(() => {
  intersect = undefined;
  reduced = false;
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(cb: typeof intersect) {
        intersect = cb;
      }
      observe() {}
      disconnect() {}
    },
  );
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: reduced && q.includes("reduce"), addEventListener() {}, removeEventListener() {} }));
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const lines = (c: HTMLElement) => [...c.querySelectorAll("[data-slot=code-block-line]")];

describe("CodeBlock", () => {
  it("numbers each line in a hidden, unselectable gutter and still copies only the code (#257)", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    const code = "const a = 1;\nconst b = 2;\nexport { a, b };";
    const { container } = render(<CodeBlock code={code} lineNumbers />);
    const numbers = [...container.querySelectorAll("[data-slot=code-block-line-number]")];
    expect(numbers.map((n) => n.textContent)).toEqual(["1", "2", "3"]);
    expect(numbers.every((n) => n.getAttribute("aria-hidden") === "true" && n.className.includes("select-none") && n.className.includes("sticky"))).toBe(true);
    // Each number sits in its own line, so the reveal shows and hides them together.
    expect(numbers[1]!.closest("[data-slot=code-block-line]")).toHaveTextContent("2const b = 2;");
    await user.click(screen.getByRole("button", { name: "Copy code" }));
    expect(writeText).toHaveBeenCalledWith(code);
    expect(await violations(container)).toEqual([]);
  }, 15_000);

  it("draws a window bar with hidden dots and the title as the file name, and keeps the copy button (#257)", async () => {
    const { container, rerender } = render(<CodeBlock code="pnpm test" title="terminal" chrome="window" />);
    const bar = container.querySelector("[data-slot=code-block-chrome]")!;
    expect(bar).toHaveTextContent("terminal");
    expect(bar.querySelector("[data-slot=code-block-dots]")).toHaveAttribute("aria-hidden", "true");
    expect(bar.querySelectorAll("[data-slot=code-block-dots] > span")).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Copy code" })).toBeInTheDocument();
    expect(await violations(container)).toEqual([]);
    rerender(<CodeBlock code="pnpm test" chrome="window" />);
    expect(container.querySelector("[data-slot=code-block-chrome]")!.textContent).toBe("");
    rerender(<CodeBlock code="pnpm test" title="terminal" />);
    expect(container.querySelector("[data-slot=code-block-chrome]")).toBeNull();
    expect(container).toHaveTextContent("terminal");
  });

  it("copies exactly the original code on click and announces it", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    const code = 'if (isAdmin) {\u202E } \u2066// admin only\u2069\nrun();';
    render(<CodeBlock code={code} lang="ts" />);
    await user.click(screen.getByRole("button", { name: "Copy code" }));
    expect(writeText).toHaveBeenCalledWith(code);
    expect(screen.getByRole("status")).toHaveTextContent("Copied");
  }, 15_000); // highlights with shiki first: room above the 5 s default when the suite runs in parallel

  it("says when copying failed", async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", { value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) }, configurable: true });
    render(<CodeBlock code="x" />);
    await user.click(screen.getByRole("button", { name: "Copy code" }));
    expect(screen.getByRole("status")).toHaveTextContent("Could not copy");
  });

  it("returns to the copy icon after 1.5 s", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    Object.defineProperty(navigator, "clipboard", { value: { writeText: vi.fn().mockResolvedValue(undefined) }, configurable: true });
    render(<CodeBlock code="x" />);
    await user.click(screen.getByRole("button", { name: "Copy code" }));
    expect(screen.getByRole("status")).toHaveTextContent("Copied");
    await act(() => vi.advanceTimersByTimeAsync(1600));
    expect(screen.getByRole("status")).toHaveTextContent("");
  });

  it("shows bidi controls and zero-width characters as visible markers (Trojan Source)", () => {
    const { container } = render(<CodeBlock code={"access = \u202Euser\u202C;\u200B"} />);
    const marks = [...container.querySelectorAll("[data-slot=code-block-hidden]")].map((m) => m.textContent);
    expect(marks).toEqual(["U+202E", "U+202C", "U+200B"]);
    expect(container.querySelector("mark")).toHaveAttribute("title", "Hidden character U+202E");
  });

  it("never renders an invisible code point and never loses visible text (property)", () => {
    fc.assert(
      fc.property(fc.string({ unit: "grapheme-composite", maxLength: 40 }), (code) => {
        const { container, unmount } = render(<CodeBlock code={code} />);
        const text = container.querySelector("code")!.textContent ?? "";
        expect(/[\u200B\u2060-\u2064\uFEFF\u202A-\u202E\u2066-\u2069\u{E0000}-\u{E007F}]/u.test(text)).toBe(false);
        const visible = code.replace(/\n$/, "").replace(/[\u200B\u2060-\u2064\uFEFF\u202A-\u202E\u2066-\u2069\u{E0000}-\u{E007F}]/gu, "").replace(/\n/g, "");
        expect(text.replace(/U\+[0-9A-F]{4,5}/g, "")).toBe(visible);
        unmount();
      }),
      { numRuns: 60 },
    );
  });

  it("highlights with theme variables only and keeps text as text", async () => {
    const { container } = render(<CodeBlock code={'const a = "<img src=x onerror=alert(1)>";'} lang="ts" />);
    await waitFor(() => expect(container.querySelector('[style*="--syntax-token-keyword"]')).not.toBeNull());
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("code")).toHaveTextContent('const a = "<img src=x onerror=alert(1)>";');
  });

  it("falls back to plain text for an unknown language", async () => {
    expect(await highlight("x", "not-a-language")).toBeNull();
    expect(await highlight("x", "__proto__")).toBeNull();
    const { container } = render(<CodeBlock code="plain" lang="not-a-language" />);
    expect(container.querySelector("code")).toHaveTextContent("plain");
  });

  it("animated: everything is in the DOM from the start and lines reveal once in view", async () => {
    vi.useFakeTimers();
    const { container } = render(<CodeBlock code={"pnpm dlx shadcn add @aedis/button\ncd app\npnpm dev"} animated lineDelay={100} />);
    expect(container.querySelector("code")).toHaveTextContent("pnpm dlx shadcn add @aedis/buttoncd apppnpm dev");
    expect(lines(container).filter((l) => l.hasAttribute("data-shown"))).toHaveLength(0);
    act(() => intersect!([{ isIntersecting: true }]));
    expect(lines(container).filter((l) => l.hasAttribute("data-shown"))).toHaveLength(1);
    expect(container.querySelector("[data-slot=code-block-cursor]")).toHaveAttribute("aria-hidden", "true");
    act(() => vi.advanceTimersByTime(250));
    expect(lines(container).every((l) => l.hasAttribute("data-shown"))).toBe(true);
    expect(container.querySelector("[data-slot=code-block-cursor]")).toBeNull();
  });

  it("animated waits while out of view", () => {
    const { container } = render(<CodeBlock code={"a\nb"} animated />);
    act(() => intersect!([{ isIntersecting: false }]));
    expect(lines(container).some((l) => l.hasAttribute("data-shown"))).toBe(false);
  });

  it("shows everything when the browser has no IntersectionObserver", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const { container } = render(<CodeBlock code={"a\nb"} animated />);
    expect(lines(container).every((l) => l.hasAttribute("data-shown"))).toBe(true);
  });

  it("reduced motion shows everything at once, without a cursor", () => {
    reduced = true;
    const { container } = render(<CodeBlock code={"a\nb\nc"} animated />);
    expect(lines(container).every((l) => l.hasAttribute("data-shown"))).toBe(true);
    expect(container.querySelector("[data-slot=code-block-cursor]")).toBeNull();
  });

  it("reads its labels from the locale and has no accessibility violations", async () => {
    const { container } = render(
      <LocaleProvider locale="pt-BR" messages={ptBR}>
        <CodeBlock code="echo ok" title="install.sh" />
      </LocaleProvider>,
    );
    expect(screen.getByRole("button", { name: "Copiar código" })).toBeInTheDocument();
    expect(screen.getByText("install.sh")).toBeInTheDocument();
    expect(await violations(container)).toEqual([]);
  });
});
