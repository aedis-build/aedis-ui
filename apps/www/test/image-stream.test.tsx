import { render } from "@testing-library/react";
import { renderToString } from "react-dom/server";

import { ImageStream, streamKeyframes, streamPath, streamPoint } from "@/registry/aedis/ui/image-stream";
import { violations } from "./a11y";

function reducedMotion(on: boolean) {
  window.matchMedia = ((q: string) => ({ matches: on && q.includes("reduce"), addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
}

const images = ["/a.svg", "/b.svg", "/c.svg"];

describe("image stream (#242)", () => {
  it("grows each card geometrically from the vanishing point and sends it out of the frame by its inner edge", () => {
    const birth = streamPoint(0, streamPath);
    const exit = streamPoint(1, streamPath);
    expect(birth).toMatchObject({ h: 2.6, x: -4, turn: 0, opacity: 0 });
    expect(exit.h).toBeCloseTo(46);
    expect(exit.x).toBeCloseTo(74);
    // The inner edge at death: the card's centre less half its width, past the frame's half width (50 cqw).
    expect(exit.x - exit.w / 2).toBeGreaterThan(50);
    // Geometric: the same ratio between any two steps the same distance apart.
    const ratio = (t: number) => streamPoint(t + 0.1, streamPath).h / streamPoint(t, streamPath).h;
    expect(ratio(0.2)).toBeCloseTo(ratio(0.7));
    // A small card stays near the axis; the rails open with its growth, sooner with a bigger fan.
    expect(streamPoint(0.25, streamPath).x).toBeLessThan(streamPoint(0.25, streamPath).h * 2);
    expect(streamPoint(0.5, { ...streamPath, fan: 3 }).x).toBeGreaterThan(streamPoint(0.5, { ...streamPath, fan: 1 }).x);
  });

  it("samples the path into keyframes, mirrored on the left rail", () => {
    const right = streamKeyframes(1, streamPath);
    const left = streamKeyframes(-1, { ...streamPath, stops: 5 });
    expect(right).toHaveLength(24);
    expect([right[0]!.offset, right.at(-1)!.offset]).toEqual([0, 1]);
    expect(right.at(-1)!.transform).toBe("translate(-50%, -50%) translateX(74cqw) rotateY(-24deg) scale(1)");
    expect(left.at(-1)!.transform).toBe("translate(-50%, -50%) translateX(-74cqw) rotateY(24deg) scale(1)");
    expect(left.map((k) => k.zIndex)).toEqual([0, 1, 3, 4, 5]);
  });

  it("is a full corridor of decorative pictures mid-flight before JavaScript runs", async () => {
    const html = renderToString(<ImageStream images={images} cards={3} />);
    expect(html.match(/data-slot="image-stream-card"/g)).toHaveLength(6);
    expect(html).toContain('alt=""');
    const { container } = render(<ImageStream images={images} cards={3} centre={<p>Film</p>}>Over it</ImageStream>);
    const cards = [...container.querySelectorAll<HTMLElement>("[data-slot=image-stream-card]")];
    expect(cards.map((c) => c.dataset.t)).toEqual(["0", "0.16666666666666666", "0.3333333333333333", "0.5", "0.6666666666666666", "0.8333333333333334"]);
    expect(cards[2]!.style.transform).toMatch(/^translate\(-50%, -50%\) translateX\([\d.]+cqw\) rotateY\(-[\d.]+deg\) scale\(0\.\d+\)$/);
    expect(container.querySelector("[aria-hidden=true]")).toContainElement(container.querySelector("[data-slot=image-stream-centre]"));
    expect(container).toHaveTextContent("Over it");
    expect(await violations(container)).toEqual([]);
  });

  it("starts every card where it stands, pauses off screen, and stays still under reduced motion", () => {
    const made: { keyframes: Keyframe[]; options: KeyframeAnimationOptions; a: { currentTime: number; play: ReturnType<typeof vi.fn>; pause: ReturnType<typeof vi.fn>; cancel: ReturnType<typeof vi.fn> } }[] = [];
    Element.prototype.animate = function (keyframes: Keyframe[], options: KeyframeAnimationOptions) {
      const a = { currentTime: 0, play: vi.fn(), pause: vi.fn(), cancel: vi.fn() };
      made.push({ keyframes, options, a });
      return a as unknown as Animation;
    } as Element["animate"];
    let seen: IntersectionObserverCallback = () => {};
    vi.stubGlobal("IntersectionObserver", class { constructor(cb: IntersectionObserverCallback) { seen = cb; } observe() {} disconnect() {} });
    try {
      const { unmount } = render(<ImageStream images={images} cards={2} speed={2} />);
      expect(made).toHaveLength(4);
      expect(made[0]!.options).toEqual({ duration: 4000, iterations: Infinity, easing: "linear" });
      expect(made.map((m) => m.a.currentTime)).toEqual([0, 1000, 2000, 3000]);
      seen([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver);
      expect(made.every((m) => m.a.pause.mock.calls.length === 1)).toBe(true);
      seen([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
      expect(made.every((m) => m.a.play.mock.calls.length === 1)).toBe(true);
      unmount();
      expect(made.every((m) => m.a.cancel.mock.calls.length === 1)).toBe(true);
      reducedMotion(true);
      render(<ImageStream images={images} cards={2} />);
      expect(made).toHaveLength(4);
    } finally {
      reducedMotion(false);
      vi.unstubAllGlobals();
      delete (Element.prototype as Partial<Element>).animate;
    }
  });
});
