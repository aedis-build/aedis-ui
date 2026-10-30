import { act, render, screen } from "@testing-library/react";

import * as React from "react";
import { renderToString } from "react-dom/server";

import {
  animateOnScroll,
  Curtain,
  Dolly,
  Draw,
  Parallax,
  Pin,
  Reveal,
  ScrollMotionProvider,
  scrollProgress,
  ScrollStage,
  ScrollTimeline,
  StageLayer,
  layoutBox,
  usePinned,
  usePinProgress,
  watchScroll,
  type PinHandle,
} from "@/registry/aedis/ui/scroll-motion";
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
afterEach(() => {
  vi.unstubAllGlobals();
  delete (Element.prototype as Partial<Element>).animate;
  delete (window as { ViewTimeline?: unknown }).ViewTimeline;
});

// jsdom has neither the Web Animations API nor scroll timelines: fakes record what the effects ask for.
type Made = { el: Element; keyframes: Keyframe[]; options: KeyframeAnimationOptions & { timeline?: { subject: Element }; rangeStart?: string; rangeEnd?: string }; currentTime: number | null; paused: boolean; cancelled: boolean };
function fakeAnimations({ native = false } = {}) {
  const made: Made[] = [];
  Element.prototype.animate = function (this: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions) {
    const a = { el: this, keyframes, options, currentTime: null, paused: false, cancelled: false } as Made;
    made.push(a);
    return Object.assign(a, { pause: () => void (a.paused = true), cancel: () => void (a.cancelled = true) }) as unknown as Animation;
  } as Element["animate"];
  if (native)
    (window as { ViewTimeline?: unknown }).ViewTimeline = class {
      subject: Element;
      inset?: string;
      constructor(o: { subject: Element; inset?: string }) {
        this.subject = o.subject;
        this.inset = o.inset;
      }
    };
  return { made };
}
const box = (el: Element, top: number, height: number) => void (el.getBoundingClientRect = () => ({ top, height }) as DOMRect);
const scrollTo = (rects: [Element, number][]) =>
  act(() => {
    for (const [el, top] of rects) box(el, top, el.getBoundingClientRect().height);
    window.dispatchEvent(new Event("scroll"));
    vi.runOnlyPendingTimers();
  });

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
    const fake = fakeAnimations();
    render(<Parallax distance={40}>Poster</Parallax>);
    expect(fake.made[0]!.keyframes).toEqual([{ transform: "translateY(40px)" }, { transform: "translateY(-40px)" }]);
    reducedMotion(true);
    render(<Parallax>Poster</Parallax>);
    expect(fake.made).toHaveLength(1);
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

describe("the scroll-progress primitive (#240)", () => {
  // A 400 px box in an 800 px viewport, and a 2000 px one taller than it.
  it("counts progress through cover, contain, entry and exit as a ViewTimeline does, with percentages and lengths", () => {
    const at = (top: number, range?: Parameters<typeof scrollProgress>[2], height = 400) => scrollProgress({ top, height }, 800, range);
    expect([800, 200, -400].map((t) => at(t))).toEqual([0, 0.5, 1]);
    expect(at(1000)).toBe(0);
    expect(at(-900)).toBe(1);
    const entry = { start: ["entry", 0], end: ["entry", 100] } as const;
    expect([800, 600, 400].map((t) => at(t, entry))).toEqual([0, 0.5, 1]);
    const exit = { start: ["exit", 0], end: ["exit", 100] } as const;
    expect([0, -200, -400].map((t) => at(t, exit))).toEqual([0, 0.5, 1]);
    const contain = { start: ["contain", 0], end: ["contain", 100] } as const;
    expect([400, 200, 0].map((t) => at(t, contain))).toEqual([0, 0.5, 1]);
    expect([0, -600, -1200].map((t) => at(t, contain, 2000))).toEqual([0, 0.5, 1]);
    // Lengths count from the start of the named range: 100svh is one viewport, 200px is 200 px.
    expect(at(-400, { start: ["contain", "0svh"], end: ["contain", "100svh"] }, 2000)).toBe(0.5);
    expect(at(700, { start: ["cover", "100px"], end: ["cover", "300px"] })).toBe(0);
    expect(at(600, { start: ["cover", "100px"], end: ["cover", "300px"] })).toBe(0.5);
    // A 72 px scroll padding (a sticky header) shortens the visible range, as view-timeline-inset: auto does.
    expect(scrollProgress({ top: 800, height: 400 }, 800, undefined, [72, 0])).toBe(0);
    expect(scrollProgress({ top: -400 + 72, height: 400 }, 800, undefined, [72, 0])).toBe(1);
    expect(scrollProgress({ top: 200, height: 2000 }, 800, { start: ["contain", 0], end: ["contain", 100] }, [100, 0])).toBe(0);
    // An empty range is a step.
    expect([at(0, { start: ["entry", 50], end: ["entry", 50] }), at(700, { start: ["entry", 50], end: ["entry", 50] })]).toEqual([1, 0]);
  });

  it("measures the layout box, not the one the effect has moved: a translate and a scale about the centre come off", () => {
    const el = document.createElement("div");
    box(el, 100, 400);
    expect(layoutBox(el)).toMatchObject({ top: 100, height: 400 });
    vi.stubGlobal("getComputedStyle", () => ({ transform: "matrix(1, 0, 0, 2, 0, 30)" }));
    vi.stubGlobal("DOMMatrixReadOnly", class { d = 2; f = 30; });
    // Scaled 2x about its centre and moved 30 px down: the 200 px box at 230 drew as 400 px at 100 + 30.
    box(el, 30, 400);
    expect(layoutBox(el)).toEqual({ top: 100, height: 200 });
  });

  it("serves every fallback effect from one scroll listener and one frame, and lets go when the last one stops", () => {
    vi.useFakeTimers();
    try {
      Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });
      const add = vi.spyOn(window, "addEventListener");
      const remove = vi.spyOn(window, "removeEventListener");
      const [a, b] = [document.createElement("div"), document.createElement("div")];
      box(a, 800, 400);
      box(b, 200, 400);
      const seen: number[][] = [[], []];
      const stopA = watchScroll(a, {}, (p) => seen[0]!.push(p));
      const stopB = watchScroll(b, {}, (p) => seen[1]!.push(p));
      expect(add.mock.calls.filter(([type]) => type === "scroll")).toHaveLength(1);
      scrollTo([
        [a, 200],
        [b, -400],
      ]);
      expect(seen).toEqual([
        [0, 0.5],
        [0.5, 1],
      ]);
      stopA();
      expect(remove.mock.calls.filter(([type]) => type === "scroll")).toHaveLength(0);
      stopB();
      expect(remove.mock.calls.filter(([type]) => type === "scroll")).toHaveLength(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("plays the same keyframes on a ViewTimeline natively, and paused with the scroll setting their time otherwise", () => {
    vi.useFakeTimers();
    try {
      Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });
      const el = document.createElement("div");
      box(el, 800, 400);
      const frames = [{ opacity: 0 }, { opacity: 1 }];
      const { made } = fakeAnimations({ native: true });
      const stop = animateOnScroll(el, frames, { range: { start: ["entry", 0], end: ["contain", "120px"] } });
      expect(made[0]!.options).toMatchObject({ fill: "both", rangeStart: "entry 0%", rangeEnd: "contain 120px" });
      expect(made[0]!.options.timeline!.subject).toBe(el);
      expect(el.dataset.scrollMode).toBe("native");
      stop();
      expect(made[0]!.cancelled).toBe(true);

      const stopFallback = animateOnScroll(el, frames, { fallback: true });
      expect(el.dataset.scrollMode).toBe("fallback");
      expect(made[1]!).toMatchObject({ keyframes: frames, paused: true, currentTime: 0 });
      scrollTo([[el, 200]]);
      expect(made[1]!.currentTime).toBe(500);
      stopFallback();
      expect(made[1]!.cancelled).toBe(true);
      delete (Element.prototype as Partial<Element>).animate;
      expect(animateOnScroll(el, frames)).toBeTypeOf("function");
    } finally {
      vi.useRealTimers();
    }
  });

  it("writes --scroll-progress on a ScrollTimeline: animated natively, set by the loop in fallback, 1 when unset", () => {
    vi.useFakeTimers();
    try {
      Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });
      const register = vi.fn();
      vi.stubGlobal("CSS", { registerProperty: register });
      const { made } = fakeAnimations({ native: true });
      render(<ScrollTimeline>x</ScrollTimeline>);
      expect(made[0]!.keyframes).toEqual([{ "--scroll-progress": 0 }, { "--scroll-progress": 1 }]);
      expect(register).toHaveBeenCalledWith({ name: "--scroll-progress", syntax: "<number>", inherits: true, initialValue: "1" });

      const { getByTestId, unmount } = render(
        <ScrollMotionProvider fallback>
          <ScrollTimeline data-testid="fallback">y</ScrollTimeline>
        </ScrollMotionProvider>,
      );
      const el = getByTestId("fallback");
      expect(el).toHaveAttribute("data-scroll-mode", "fallback");
      box(el, 800, 400);
      scrollTo([[el, 200]]);
      expect(el.style.getPropertyValue("--scroll-progress")).toBe("0.5");
      unmount();
      expect(el.style.getPropertyValue("--scroll-progress")).toBe("");
    } finally {
      vi.useRealTimers();
    }
  });

  it("gives each effect its keyframes and range, draws every stroke from pathLength 1, and does nothing under reduced motion", async () => {
    const { made } = fakeAnimations({ native: true });
    const { container } = render(
      <>
        <Curtain>a</Curtain>
        <Dolly scale={1.2}>b</Dolly>
        <Draw>
          <svg aria-hidden="true">
            <path d="M0 0L10 10" />
            <circle r="4" />
          </svg>
        </Draw>
      </>,
    );
    expect(made.map((m) => [m.keyframes, m.options.rangeStart, m.options.rangeEnd])).toEqual([
      [[{ clipPath: "inset(12% 8% 0% 8% round 16px)" }, { clipPath: "inset(0% 0% 0% 0% round 0px)" }], "entry 0%", "entry 100%"],
      [[{ transform: "scale(1.2)" }, { transform: "scale(1)" }], "cover 0%", "cover 100%"],
      [[{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], "contain 0%", "contain 100%"],
      [[{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], "contain 0%", "contain 100%"],
    ]);
    const path = container.querySelector("path")!;
    expect(path).toHaveAttribute("pathLength", "1");
    expect(path.style.strokeDasharray).toBe("1");
    // The scaled picture plays on the Dolly box's timeline, which does not move.
    expect(made[1]!.options.timeline!.subject).toBe(container.querySelector("[data-slot=dolly]"));
    // The strokes play on the Draw box's timeline, not their own.
    expect(made[2]!.options.timeline!.subject).toBe(container.querySelector("[data-slot=draw]"));
    expect(await violations(container)).toEqual([]);

    reducedMotion(true);
    render(<Curtain>c</Curtain>);
    expect(made).toHaveLength(4);
  });

  it("clears the strokes it dashed when it stops", () => {
    fakeAnimations({ native: true });
    const { container, unmount } = render(
      <Draw>
        <svg aria-hidden="true">
          <path d="M0 0L10 10" />
        </svg>
      </Draw>,
    );
    const path = container.querySelector("path")!;
    unmount();
    expect(path.style.strokeDasharray).toBe("");
  });

  it("blurs a Reveal only when asked", () => {
    const { container } = render(
      <>
        <Reveal blur>a</Reveal>
        <Reveal>b</Reveal>
      </>,
    );
    const [blurred, plain] = container.querySelectorAll("[data-slot=reveal]");
    expect(blurred!.className).toContain("data-[state=hidden]:blur-[6px]");
    expect(plain!.className).not.toContain("blur");
  });
});

describe("scroll stage (#240)", () => {
  function Scene() {
    return (
      <ScrollStage track={3} aria-label="Premiere">
        <StageLayer at={[0.5, 1.5]} from={{ opacity: 0, filter: "blur(6px)" }} to={{ opacity: 1, filter: "none" }}>
          Now showing
        </StageLayer>
      </ScrollStage>
    );
  }

  it("is one screen on the server, with every layer in its own style", () => {
    const html = renderToString(<Scene />);
    expect(html).not.toContain("300svh");
    expect(html).not.toContain("sticky");
    expect(html).toContain("Now showing");
  });

  it("after mount lays out its track and plays each layer over its stretch of it, on the stage's timeline", () => {
    const { made } = fakeAnimations({ native: true });
    const { container } = render(<Scene />);
    const stage = container.querySelector("[data-slot=scroll-stage]") as HTMLElement;
    expect(stage).toHaveAttribute("data-staged", "true");
    expect(stage.style.height).toBe("300svh");
    expect(stage.firstElementChild!.className).toContain("sticky");
    const layer = made.find((m) => (m.el as HTMLElement).dataset.slot === "stage-layer")!;
    expect(layer.keyframes).toEqual([
      { opacity: 0, filter: "blur(6px)" },
      { opacity: 1, filter: "none" },
    ]);
    expect(layer.options).toMatchObject({ rangeStart: "contain 50svh", rangeEnd: "contain 150svh" });
    expect(layer.options.timeline!.subject).toBe(stage);
    expect((layer.options.timeline as unknown as { inset: string }).inset).toBe("0px");
  });

  it("collapses to one still screen under reduced motion", () => {
    reducedMotion(true);
    const { made } = fakeAnimations({ native: true });
    const { container } = render(<Scene />);
    const stage = container.querySelector("[data-slot=scroll-stage]") as HTMLElement;
    expect(stage).not.toHaveAttribute("data-staged");
    expect(stage.style.height).toBe("");
    expect(made).toHaveLength(0);
  });

  it("leaves a layer outside a stage alone", () => {
    const { made } = fakeAnimations({ native: true });
    render(
      <StageLayer from={{ opacity: 0 }} to={{ opacity: 1 }}>
        alone
      </StageLayer>,
    );
    expect(made).toHaveLength(0);
  });
});
