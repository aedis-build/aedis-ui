import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Carousel, Slideshow } from "@/registry/aedis/ui/carousel";
import { Lightbox } from "@/registry/aedis/ui/lightbox";
import { Parallax, Reveal } from "@/registry/aedis/ui/scroll-motion";
import { Video } from "@/registry/aedis/ui/video";

// The browser paths jsdom lacks (IntersectionObserver, WAAPI, ViewTimeline), driven by fakes.

type Entry = Partial<IntersectionObserverEntry> & { target: Element };
let observers: { cb: IntersectionObserverCallback; els: Element[] }[] = [];
class FakeObserver {
  me: { cb: IntersectionObserverCallback; els: Element[] };
  constructor(cb: IntersectionObserverCallback) {
    this.me = { cb, els: [] };
    observers.push(this.me);
  }
  observe(el: Element) {
    this.me.els.push(el);
  }
  disconnect() {}
}
const emit = (pick: (el: Element, i: number) => Entry | null) =>
  act(() => {
    for (const o of observers) o.cb(o.els.map(pick).filter(Boolean) as IntersectionObserverEntry[], {} as IntersectionObserver);
  });

const animate = vi.fn(() => ({ cancel: vi.fn() }));
const rect = Element.prototype.getBoundingClientRect;

beforeEach(() => {
  observers = [];
  animate.mockClear();
  window.matchMedia = ((q: string) => ({ matches: false && q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
  vi.stubGlobal("IntersectionObserver", FakeObserver);
  Element.prototype.animate = animate as unknown as Element["animate"];
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  Element.prototype.getBoundingClientRect = rect;
  delete (Element.prototype as { animate?: unknown }).animate;
});

const slides = ["One", "Two", "Three"].map((s) => <p key={s}>{s}</p>);

describe("carousel in a browser", () => {
  it("follows the slides the observer reports in view", () => {
    render(<Carousel label="Work">{slides}</Carousel>);
    emit((el) => ({ target: el, intersectionRatio: (el as HTMLElement).dataset.index === "1" ? 1 : 0 }));
    const live = screen.getAllByRole("group").filter((g) => !g.hasAttribute("inert"));
    expect(live.map((g) => g.textContent)).toEqual(["Two"]);
  });

  it("draws the autoplay progress with WAAPI while it runs", () => {
    vi.useFakeTimers();
    render(
      <Slideshow label="Reel" autoplay interval={2000}>
        {slides}
      </Slideshow>,
    );
    expect(animate).toHaveBeenCalledWith([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], expect.objectContaining({ duration: 2000 }));
  });
});

describe("video in a browser", () => {
  it("attaches its source only once it comes near the viewport", () => {
    const { container } = render(<Video src="/a.webm" title="Reel" />);
    expect(container.querySelector("source")).toBeNull();
    emit((el) => ({ target: el, isIntersecting: true }));
    expect(container.querySelector("source")).toHaveAttribute("src", "/a.webm");
  });
});

describe("lightbox in a browser", () => {
  it("grows the opened image from its thumbnail", async () => {
    const user = userEvent.setup();
    Element.prototype.getBoundingClientRect = function () {
      return { left: 10, top: 20, width: this.tagName === "IMG" ? 400 : 100, height: this.tagName === "IMG" ? 500 : 125 } as DOMRect;
    };
    render(<Lightbox zoomFromThumbnail items={[{ src: "/a.svg", alt: "Sign", title: "Studio" }]} />);
    await user.click(screen.getByRole("button", { name: "Sign" }));
    await screen.findByRole("dialog", { name: "Studio" });
    await waitFor(() => expect(animate).toHaveBeenCalled());
    expect((animate.mock.calls[0] as unknown[])[0]).toEqual([expect.objectContaining({ transformOrigin: "top left" }), { transform: "none", transformOrigin: "top left" }]);
    await user.keyboard("{Shift>}{Tab}{/Shift}");
    expect(screen.getByRole("dialog").contains(document.activeElement)).toBe(true);
  });
});

describe("scroll motion in a browser", () => {
  it("settles a revealed block once its transition ends", () => {
    const { container } = render(<Reveal>Step</Reveal>);
    emit((el) => ({ target: el, isIntersecting: false }));
    emit((el) => ({ target: el, isIntersecting: true }));
    const el = container.firstElementChild!;
    expect(el).toHaveAttribute("data-state", "shown");
    fireEvent.transitionEnd(el);
    expect(el).toHaveAttribute("data-state", "static");
  });

  it("drives parallax with a ViewTimeline where there is one, and with scroll events elsewhere", async () => {
    vi.stubGlobal("ViewTimeline", class {});
    const { unmount } = render(<Parallax distance={20}>Poster</Parallax>);
    expect(animate).toHaveBeenCalledWith([{ transform: "translateY(20px)" }, { transform: "translateY(-20px)" }], expect.objectContaining({ fill: "both" }));
    unmount();
    vi.unstubAllGlobals();
    vi.stubGlobal("IntersectionObserver", FakeObserver);
    const { container } = render(<Parallax distance={20}>Poster</Parallax>);
    const el = container.firstElementChild as HTMLElement;
    act(() => void window.dispatchEvent(new Event("scroll")));
    expect(el.style.willChange).toBe("transform");
    await waitFor(() => expect(el.style.willChange).toBe(""), { timeout: 1000 });
  });
});
