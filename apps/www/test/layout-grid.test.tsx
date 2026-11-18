import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LayoutGrid, layoutSlots, type LayoutGridItem } from "@/registry/aedis/ui/layout-grid";
import { violations } from "./a11y";

const H = 3 / 2;
const V = 9 / 16;

const items: LayoutGridItem[] = [
  { kind: "photo", src: "/media/work-1.svg", ratio: H, alt: "Lobby in gold light", title: "Casa do Largo", label: "Lisbon", description: "A lobby on the square." },
  { kind: "film", src: "/media/showreel.webm", type: "video/webm", ratio: V, alt: "Walking in", title: "Arrival", description: "From the door to the key." },
];

function reducedMotion(on: boolean) {
  window.matchMedia = ((q: string) => ({ matches: on && q.includes("reduce"), addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
  reducedMotion(false);
  // jsdom has the dialog element but not its modal behaviour.
  Object.assign(HTMLDialogElement.prototype, {
    showModal(this: HTMLDialogElement) {
      this.setAttribute("open", "");
    },
    close(this: HTMLDialogElement) {
      this.removeAttribute("open");
      this.dispatchEvent(new Event("close"));
    },
  });
  Object.assign(HTMLMediaElement.prototype, { play: () => Promise.resolve(), pause() {} });
  Reflect.deleteProperty(document, "startViewTransition");
});

describe("layoutSlots (#273)", () => {
  it("alternates 2+1 and 1+2, the horizontal piece of each pair taking the wide block", () => {
    expect(layoutSlots([H, V, V, H, H, H])).toEqual([
      { column: "1 / span 2", row: "1", aspect: H },
      { column: "3", row: "1" },
      { column: "1", row: "2" },
      { column: "2 / span 2", row: "2", aspect: H },
      { column: "1 / span 2", row: "3", aspect: H },
      { column: "3", row: "3" },
    ]);
  });

  it("puts three vertical pieces in a group: a feature beside two stacked blocks, switching sides, without holes", () => {
    expect(layoutSlots([V, V, V, V, V, V])).toEqual([
      { column: "1 / span 2", row: "1 / span 2", aspect: V },
      { column: "3", row: "1" },
      { column: "3", row: "2" },
      { column: "2 / span 2", row: "3 / span 2", aspect: V },
      { column: "1", row: "3" },
      { column: "1", row: "4" },
    ]);
  });

  it("mixes groups and pairs, and gives a last piece alone a whole row or the middle column", () => {
    expect(layoutSlots([H, V, V, V, V, V, H, V])).toEqual([
      { column: "1 / span 2", row: "1", aspect: H },
      { column: "3", row: "1" },
      { column: "1 / span 2", row: "2 / span 2", aspect: V },
      { column: "3", row: "2" },
      { column: "3", row: "3" },
      { column: "1", row: "4" },
      { column: "2 / span 2", row: "4", aspect: H },
      { column: "2", row: "5", aspect: V },
    ]);
    expect(layoutSlots([V, V])[0]).toEqual({ column: "1 / span 2", row: "1", aspect: 3 / 2 });
    expect(layoutSlots([H])).toEqual([{ column: "1 / span 3", row: "1", aspect: H }]);
    expect(layoutSlots([])).toEqual([]);
  });
});

describe("layout-grid (#273)", () => {
  it("names each block by its kind and title, links it to its file, and passes axe", async () => {
    const { container } = render(<LayoutGrid items={items} chapter={{ number: "01", name: "Coast", label: "Hotels" }} />);
    expect(screen.getByRole("region", { name: "Coast" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Photo: Casa do Largo" })).toHaveAttribute("href", "/media/work-1.svg");
    expect(screen.getByRole("link", { name: "Film: Arrival" })).toHaveAttribute("href", "/media/showreel.webm");
    expect(container.querySelector("[data-variant=background] video")).toHaveAttribute("loop");
    expect(await violations(container)).toEqual([]);
  });

  it("opens a card named by the title, focuses Close, and gives the focus back to the block on close", async () => {
    const user = userEvent.setup();
    render(<LayoutGrid items={items} />);
    const block = screen.getByRole("link", { name: "Photo: Casa do Largo" });
    await user.click(block);
    const dialog = screen.getByRole("dialog", { name: "Casa do Largo" });
    expect(dialog).toHaveTextContent("Lisbon");
    expect(dialog).toHaveTextContent("A lobby on the square.");
    expect(screen.getByRole("img", { name: "Lobby in gold light" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
    expect(await violations(dialog)).toEqual([]);
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(block).toHaveFocus();
  });

  it("closes on a click outside the card, not on the card", async () => {
    const user = userEvent.setup();
    render(<LayoutGrid items={items} />);
    await user.click(screen.getByRole("link", { name: "Film: Arrival" }));
    const dialog = screen.getByRole("dialog", { name: "Arrival" });
    expect(dialog.querySelector("video")).toHaveAttribute("controls");
    await user.click(screen.getByText("From the door to the key."));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.click(dialog);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("steps the copy aside a moment after the film starts, and back when it pauses", () => {
    vi.useFakeTimers();
    try {
      render(<LayoutGrid items={items} />);
      fireEvent.click(screen.getByRole("link", { name: "Film: Arrival" }));
      const copy = screen.getByText("From the door to the key.").parentElement!;
      const video = screen.getByRole("dialog").querySelector("video")!;
      fireEvent.play(video);
      expect(copy).not.toHaveAttribute("data-aside");
      act(() => void vi.advanceTimersByTime(1200));
      expect(copy).toHaveAttribute("data-aside");
      fireEvent.pause(video);
      expect(copy).not.toHaveAttribute("data-aside");
    } finally {
      vi.useRealTimers();
    }
  });

  it("grows the card from the block with one transient view-transition-name, and opens at once with reduced motion", async () => {
    const user = userEvent.setup();
    const names: string[] = [];
    const start = vi.fn((update: () => void) => {
      names.push(screen.getByRole("link", { name: "Photo: Casa do Largo" }).parentElement!.style.viewTransitionName);
      update();
      return { finished: Promise.resolve() };
    });
    Object.assign(document, { startViewTransition: start });
    const { unmount } = render(<LayoutGrid items={items} />);
    await user.click(screen.getByRole("link", { name: "Photo: Casa do Largo" }));
    expect(start).toHaveBeenCalledTimes(1);
    expect(names).toEqual(["layout-grid-card"]);
    expect(screen.getByRole("link", { name: "Photo: Casa do Largo", hidden: true }).parentElement!.style.viewTransitionName).toBe("");
    await vi.waitFor(() => expect(document.querySelector<HTMLElement>("[data-slot=layout-grid-card]")!.style.viewTransitionName).toBe(""));
    unmount();

    start.mockClear();
    reducedMotion(true);
    render(<LayoutGrid items={items} />);
    await user.click(screen.getByRole("link", { name: "Photo: Casa do Largo" }));
    expect(start).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "Casa do Largo" })).toBeInTheDocument();
  });

  it("leaves a modified click to the browser, so the file opens in a new tab", () => {
    render(<LayoutGrid items={items} />);
    const event = fireEvent.click(screen.getByRole("link", { name: "Photo: Casa do Largo" }), { metaKey: true });
    expect(event).toBe(true);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
