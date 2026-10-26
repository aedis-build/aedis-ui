import { act, render } from "@testing-library/react";
import fc from "fast-check";

import { themeCss } from "@/registry/aedis/lib/theme-css";
import { settledMarkdown, splitSettled, StreamingMarkdown } from "@/registry/aedis/ui/streaming-markdown";

describe("settledMarkdown", () => {
  it("holds back links, bare URLs and dangling markers until they complete", () => {
    expect(settledMarkdown("See [the docs](https://exa")).toBe("See the docs");
    expect(settledMarkdown("See [the docs](")).toBe("See the docs");
    expect(settledMarkdown("See [the docs](https://example.com) now")).toBe("See [the docs](https://example.com) now");
    expect(settledMarkdown("Open https://exam")).toBe("Open ");
    expect(settledMarkdown("Open www.exa")).toBe("Open ");
    expect(settledMarkdown("**bol")).toBe("bol");
    expect(settledMarkdown("**bold** and *it")).toBe("**bold** and it");
    expect(settledMarkdown("`code` and `mo")).toBe("`code` and mo");
    expect(settledMarkdown("a snake_ca")).toBe("a snake_ca");
    expect(settledMarkdown("**done**")).toBe("**done**");
  });
});

describe("StreamingMarkdown", () => {
  beforeEach(() => vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => (cb(0), 1)));
  afterEach(() => vi.unstubAllGlobals());

  it("never makes a half-written URL clickable (property)", () => {
    const word = fc.stringMatching(/^[a-z]{1,8}$/);
    const link = fc.tuple(word, fc.stringMatching(/^[a-z]{1,8}$/)).map(([t, p]) => ({ text: `[${t}](https://example.com/${p})`, href: `https://example.com/${p}` }));
    const piece = fc.oneof(word.map((w) => ({ text: `${w} `, href: null as string | null })), link.map((l) => ({ ...l, text: `${l.text} ` })));
    fc.assert(
      fc.property(fc.array(piece, { minLength: 1, maxLength: 8 }), fc.nat(), (pieces, cut) => {
        const full = pieces.map((p) => p.text).join("");
        const prefix = full.slice(0, cut % (full.length + 1));
        const complete = new Set(pieces.filter((p) => p.href && prefix.includes(p.text.trim())).map((p) => p.href));
        const { container, unmount } = render(<StreamingMarkdown streaming>{prefix}</StreamingMarkdown>);
        for (const a of container.querySelectorAll("a")) expect(complete.has(a.getAttribute("href"))).toBe(true);
        unmount();
      }),
      { numRuns: 80 },
    );
  });

  it("keeps Markdown's rules: no raw HTML, unsafe links dropped, images off", () => {
    const { container } = render(<StreamingMarkdown>{"<img src=x onerror=alert(1)> [bad](javascript:alert(1)) ![p](https://e.com/p.png)"}</StreamingMarkdown>);
    expect(container.querySelector("img, a")).toBeNull();
  });

  it("renders at most once per animation frame and caps the length", () => {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => frames.push(cb));
    vi.stubGlobal("cancelAnimationFrame", (id: number) => (frames[id - 1] = () => {}));
    const { container, rerender } = render(<StreamingMarkdown streaming maxLength={12}>{"Hel"}</StreamingMarkdown>);
    rerender(<StreamingMarkdown streaming maxLength={12}>{"Hello"}</StreamingMarkdown>);
    rerender(<StreamingMarkdown streaming maxLength={12}>{"Hello, world and more"}</StreamingMarkdown>);
    act(() => frames.at(-1)!(0));
    expect(container.textContent).toBe("Hello, world");
  });

  it("shows a caret only while streaming, never under reduced motion, and marks itself busy", () => {
    const { container, rerender } = render(<StreamingMarkdown streaming>{"Thinking"}</StreamingMarkdown>);
    const root = container.firstElementChild!;
    expect(root).toHaveAttribute("aria-busy", "true");
    expect(root.className).toContain("stream-caret");
    rerender(<StreamingMarkdown>{"Done"}</StreamingMarkdown>);
    expect(root).not.toHaveAttribute("aria-busy");
    expect(root.className).not.toContain("stream-caret");
    const css = themeCss();
    const caret = css.slice(css.indexOf("@utility stream-caret"), css.indexOf("@keyframes caret"));
    expect(caret).toMatch(/prefers-reduced-motion: reduce\)[\s\S]*content: none/);
  });

  it("parses only the paragraph being written, never splitting a code fence (#155)", () => {
    expect(splitSettled("One.\n\nTwo")).toEqual(["One.", "Two"]);
    expect(splitSettled("Short")).toEqual(["", "Short"]);
    expect(splitSettled("A\n\n```\nx\n\ny")).toEqual(["A", "```\nx\n\ny"]);
    expect(splitSettled("A\n\nB\n\n")).toEqual(["A", "B\n\n"]);
  });

  it("renders straight away without requestAnimationFrame", () => {
    vi.stubGlobal("requestAnimationFrame", undefined);
    const { container, rerender } = render(<StreamingMarkdown>{"a"}</StreamingMarkdown>);
    rerender(<StreamingMarkdown>{"ab"}</StreamingMarkdown>);
    expect(container.textContent).toBe("ab");
  });
});
