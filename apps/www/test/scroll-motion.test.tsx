import { act, render, screen } from "@testing-library/react";

import * as React from "react";
import { renderToString } from "react-dom/server";

import { Parallax, Pin, Reveal, usePinned, usePinProgress, type PinHandle } from "@/registry/aedis/ui/scroll-motion";
import { violations } from "./a11y";

let observed: { cb: IntersectionObserverCallback; el?: Element }[] = [];
class FakeObserver {
  cb: IntersectionObserverCallback;
  constructor(cb: IntersectionObserverCallback) {
    this.cb = cb;
    observed.push({ cb });
  }
  observe(el: Element) {
    observed.at(-1)!.el = el;
  }
  disconnect() {}
}
const fire = (isIntersecting: boolean) =>
  act(() => observed.forEach((o) => o.cb([{ isIntersecting, target: o.el } as IntersectionObserverEntry], {} as IntersectionObserver)));

function reducedMotion(on: boolean) {
  window.matchMedia = ((q: string) => ({ matches: on && q.includes("reduce"), addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
  observed = [];
  reducedMotion(false);
  vi.stubGlobal("IntersectionObserver", FakeObserver);
});
afterEach(() => vi.unstubAllGlobals());

describe("reveal (#191)", () => {
  it("renders its content visible, hides what is below the fold, and reveals it on entering", async () => {
    const { container } = render(<Reveal>We ship the one you choose.</Reveal>);
    const el = container.firstElementChild!;
    expect(el).toHaveAttribute("data-state", "static");
    expect(screen.getByText("We ship the one you choose.")).toBeInTheDocument();
    fire(false);
    expect(el).toHaveAttribute("data-state", "hidden");
    fire(true);
    expect(el).toHaveAttribute("data-state", "shown");
    expect(await violations(container)).toEqual([]);
  });

  it("never hides content already in view, nor anything under reduced motion", () => {
    const { container } = render(<Reveal>In view</Reveal>);
    fire(true);
    expect(container.firstElementChild).toHaveAttribute("data-state", "static");
    observed = [];
    reducedMotion(true);
    const { container: still } = render(<Reveal>Still</Reveal>);
    expect(observed).toHaveLength(0);
    expect(still.firstElementChild).toHaveAttribute("data-state", "static");
  });
});

describe("parallax (#191)", () => {
  it("moves only transform with the scroll, and nothing under reduced motion", () => {
    const { container } = render(<Parallax distance={40}>Poster</Parallax>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.transform).toMatch(/^translateY\(/);
    reducedMotion(true);
    const { container: still } = render(<Parallax>Poster</Parallax>);
    expect((still.firstElementChild as HTMLElement).style.transform).toBe("");
  });
});

function Step() {
  return <p>{Math.round(usePinProgress() * 100)}%</p>;
}

describe("pin (#191)", () => {
  it("gives the children their progress through the pinned run", async () => {
    const { container } = render(
      <Pin length={1}>
        <Step />
      </Pin>,
    );
    const pin = container.firstElementChild as HTMLElement;
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });
    pin.getBoundingClientRect = () => ({ top: -400, height: 1600 }) as DOMRect;
    act(() => void window.dispatchEvent(new Event("resize")));
    expect(await screen.findByText("50%")).toBeInTheDocument();
    expect(pin.firstElementChild!.className).toContain("sticky");
  });

  it("is a plain section in its final state under reduced motion", () => {
    reducedMotion(true);
    const { container } = render(<Pin>{(p) => <p>{p}</p>}</Pin>);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect((container.firstElementChild as HTMLElement).style.height).toBe("");
  });

  it("pins only where its media matches, says so, and reduced motion still wins (#225)", () => {
    const wide = (q: string) => !q.includes("reduce") && q.includes("min-width");
    window.matchMedia = ((q: string) => ({ matches: wide(q), addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
    const changes: boolean[] = [];
    function State() {
      return <p>{usePinned() ? "pinned" : "plain"}</p>;
    }
    const { container, unmount } = render(
      <Pin media="(min-width: 1000px)" onPinnedChange={(p) => changes.push(p)}>
        <State />
      </Pin>,
    );
    expect(screen.getByText("pinned")).toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute("data-pinned", "true");
    expect(changes).toEqual([true]);
    unmount();
    const { container: narrow } = render(
      <Pin media="(max-width: 10px)">
        <State />
      </Pin>,
    );
    expect(screen.getByText("plain")).toBeInTheDocument();
    expect((narrow.firstElementChild as HTMLElement).style.height).toBe("");
    window.matchMedia = ((q: string) => ({ matches: true && q !== "", addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
    const { container: reducedPin } = render(<Pin media="(min-width: 1px)">x</Pin>);
    expect(reducedPin.firstElementChild).not.toHaveAttribute("data-pinned");
  });

  it("renders a plain section on the server", () => {
    const html = renderToString(<Pin length={1}>{(p) => <p>{p}</p>}</Pin>);
    expect(html).not.toContain("sticky");
    expect(html).not.toContain("svh");
  });

  it("scrolls the page to a progress of its own run, instantly under reduced motion (#225)", () => {
    const scrollTo = vi.fn();
    window.scrollTo = scrollTo as unknown as typeof window.scrollTo;
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });
    Object.defineProperty(window, "scrollY", { configurable: true, value: 1000 });
    const handle = React.createRef<PinHandle>();
    const { container } = render(
      <Pin ref={handle} length={1}>
        x
      </Pin>,
    );
    const pin = container.firstElementChild as HTMLElement;
    pin.getBoundingClientRect = () => ({ top: 200, height: 1600 }) as DOMRect;
    Object.defineProperty(pin, "offsetHeight", { configurable: true, value: 1600 });
    act(() => handle.current!.scrollTo(0.5));
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 1600, behavior: "smooth" });
    act(() => handle.current!.scrollTo(2, { behavior: "smooth" }));
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 2000, behavior: "smooth" });
  });
});
