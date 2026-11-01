import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";

import { TextMask } from "@/registry/aedis/ui/text-mask";
import { violations } from "./a11y";

function reducedMotion(on: boolean) {
  window.matchMedia = ((q: string) => ({ matches: on && q.includes("reduce"), addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
}

type Made = { el: Element; keyframes: Keyframe[]; options: KeyframeAnimationOptions & { timeline?: { subject: Element; inset?: string } } };
let made: Made[] = [];
beforeEach(() => {
  made = [];
  reducedMotion(false);
  Element.prototype.animate = function (this: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions) {
    made.push({ el: this, keyframes, options } as Made);
    return { cancel() {}, pause() {} } as unknown as Animation;
  } as Element["animate"];
  (window as { ViewTimeline?: unknown }).ViewTimeline = class {
    subject: Element;
    inset?: string;
    constructor(o: { subject: Element; inset?: string }) {
      this.subject = o.subject;
      this.inset = o.inset;
    }
  };
});
afterEach(() => {
  delete (Element.prototype as Partial<Element>).animate;
  delete (window as { ViewTimeline?: unknown }).ViewTimeline;
  vi.restoreAllMocks();
});

describe("text mask (#241)", () => {
  it("names itself once with real text and hides the word, the mask and the media", async () => {
    const { container } = render(<TextMask text="STUDIO" label="RLFN Studio" image="/a.svg" />);
    expect(screen.getByText("RLFN Studio")).toHaveClass("sr-only");
    const stage = container.querySelector("[aria-hidden=true]")!;
    expect(stage).toHaveTextContent("STUDIO");
    expect(stage.querySelector("img")).toHaveAttribute("alt", "");
    expect(container.querySelector("[data-slot=text-mask-layer]")).toHaveClass("bg-media-mask", "mix-blend-multiply");
    expect(container.firstElementChild).not.toHaveAttribute("data-flying");
    expect(await violations(container)).toEqual([]);
  });

  it("plays a film muted and looping, and keeps it on its poster under reduced motion", () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    const pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    const { container, unmount } = render(<TextMask text="FILM" label="Film" video="/f.webm" poster="/p.svg" />);
    const video = container.querySelector("video")!;
    expect(video.muted).toBe(true);
    expect(video).toHaveAttribute("loop");
    expect(video).toHaveAttribute("poster", "/p.svg");
    expect(play).toHaveBeenCalled();
    unmount();
    reducedMotion(true);
    render(<TextMask text="FILM" label="Film" video="/f.webm" poster="/p.svg" />);
    expect(pause).toHaveBeenCalled();
  });

  it("is a still mask on the server and under reduced motion, with no runway", () => {
    expect(renderToString(<TextMask text="RLFN" label="RLFN" image="/a.svg" fly={{ glyph: 1 }} />)).not.toContain("svh;");
    reducedMotion(true);
    const { container } = render(<TextMask text="RLFN" label="RLFN" image="/a.svg" fly={{ glyph: 1 }} />);
    expect(container.firstElementChild).not.toHaveAttribute("data-flying");
    expect(made).toHaveLength(0);
  });

  it("flies through the glyph's point: measured with a Range, moved to the centre, zoomed by keyframes", () => {
    // The word is 400 × 100 at (100, 200) in a 1000 × 800 stage; the L is the second glyph, 100 px wide.
    Range.prototype.getBoundingClientRect = () => ({ left: 200, top: 200, width: 100, height: 100 }) as DOMRect;
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ left: 100, top: 200, width: 400, height: 100 } as DOMRect);
    vi.spyOn(HTMLElement.prototype, "offsetLeft", "get").mockReturnValue(300);
    vi.spyOn(HTMLElement.prototype, "offsetTop", "get").mockReturnValue(350);
    vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(400);
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(100);
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(1000);
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(800);
    const { container } = render(<TextMask text="RLFN" label="RLFN Studio" image="/a.svg" fly={{ glyph: 1, origin: [0.2, 0.5], track: 2 }} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute("data-flying", "true");
    expect(root.style.height).toBe("300svh");
    // The point is 120 px into the word, half way down: 30% 50%. In the stage it is at (420, 400); the centre is (500, 400).
    const word = container.querySelector("[data-slot=text-mask-layer] span") as HTMLElement;
    expect(word.style.transformOrigin).toBe("30.00% 50.00%");
    const [zoom, fade] = made;
    expect(zoom!.el).toBe(word);
    expect(zoom!.keyframes.map((k) => k.transform)).toEqual(["translate(0px, 0px) scale(1)", "translate(80px, 0px) scale(1.3)", "translate(80px, 0px) scale(2.2)", "translate(80px, 0px) scale(7)", "translate(80px, 0px) scale(34)"]);
    expect(zoom!.options.timeline!.subject).toBe(root);
    expect(zoom!.options.timeline!.inset).toBe("0px");
    expect(fade!.keyframes).toEqual([{ opacity: 1 }, { opacity: 1, offset: 0.66 }, { opacity: 0 }]);
    delete (Range.prototype as Partial<Range>).getBoundingClientRect;
  });
});
