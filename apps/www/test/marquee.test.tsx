import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Marquee } from "@/registry/aedis/ui/marquee";
import { violations } from "./a11y";

// jsdom has no Web Animations API: a fake records what the marquee asks of it.
type Fake = { keyframes: Keyframe[]; options: KeyframeAnimationOptions; pause: ReturnType<typeof vi.fn>; play: ReturnType<typeof vi.fn>; cancel: ReturnType<typeof vi.fn> };
let made: Fake[] = [];
beforeEach(() => {
  made = [];
  HTMLElement.prototype.animate = vi.fn(function (keyframes: Keyframe[], options: KeyframeAnimationOptions) {
    const a = { keyframes, options, pause: vi.fn(), play: vi.fn(), cancel: vi.fn() };
    made.push(a);
    return a as unknown as Animation;
  }) as unknown as HTMLElement["animate"];
});
afterEach(() => {
  delete (HTMLElement.prototype as Partial<HTMLElement>).animate;
  vi.unstubAllGlobals();
});

const words = ["Brand", "Campaigns", "Motion"];

describe("marquee (#248)", () => {
  it("gives screen readers each item once, in a list, and has no accessibility violations", async () => {
    const { container } = render(<Marquee items={words.map((w) => <span key={w}>{w}</span>)} lines={2} />);
    expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual(words);
    // Two copies per line, two lines: four lists in the DOM, one exposed.
    expect(container.querySelectorAll("ul")).toHaveLength(4);
    expect(await violations(container)).toEqual([]);
  });

  it("slides half the track per loop, linearly, the second line the other way", () => {
    render(<Marquee items={words} speed={30} lines={2} direction="right" />);
    expect(made).toHaveLength(2);
    expect(made[0]!.keyframes).toEqual([{ transform: "translateX(0)" }, { transform: "translateX(-50%)" }]);
    expect(made[0]!.options).toMatchObject({ duration: 30_000, iterations: Infinity, easing: "linear", direction: "reverse" });
    expect(made[1]!.options).toMatchObject({ direction: "normal" });
  });

  it("pauses on hover and focus, and the button stops it until pressed again", async () => {
    const user = userEvent.setup();
    render(<Marquee items={[<a key="a" href="/work">Work</a>]} />);
    const [a] = made;
    const root = screen.getByRole("list").closest("[data-slot=marquee]")!;
    fireEvent.pointerEnter(root);
    expect(a!.pause).toHaveBeenCalled();
    fireEvent.pointerLeave(root);
    expect(a!.play).toHaveBeenCalled();

    a!.pause.mockClear();
    act(() => screen.getByRole("link", { name: "Work" }).focus());
    expect(a!.pause).toHaveBeenCalled();
    a!.play.mockClear();
    await user.click(screen.getByRole("button", { name: "Pause the moving line" }));
    fireEvent.pointerLeave(root);
    act(() => screen.getByRole("button", { name: "Play the moving line" }).blur());
    // Stopped by the button: leaving and blurring do not restart it.
    expect(a!.play).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Play the moving line" }));
    fireEvent.pointerLeave(root);
    expect(a!.play).toHaveBeenCalled();
  });

  it("as a backdrop is hidden decoration that never pauses on hover and has no button", () => {
    const { container, unmount } = render(<Marquee variant="backdrop" items={words} />);
    const root = container.querySelector("[data-slot=marquee]")!;
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(root).toHaveClass("pointer-events-none", "opacity-7");
    expect(within(root as HTMLElement).queryByRole("button", { hidden: true })).toBeNull();
    fireEvent.pointerEnter(root);
    expect(made[0]!.pause).not.toHaveBeenCalled();
    unmount();
    expect(made[0]!.cancel).toHaveBeenCalled();
  });

  it("stands still under reduced motion, and without the Web Animations API", () => {
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("reduce"), addEventListener: () => {}, removeEventListener: () => {} }));
    const { unmount } = render(<Marquee>Static</Marquee>);
    expect(made).toHaveLength(0);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual(["Static"]);
    unmount();
    vi.unstubAllGlobals();
    delete (HTMLElement.prototype as Partial<HTMLElement>).animate;
    render(<Marquee>No API</Marquee>);
    expect(screen.getByRole("button", { name: "Pause the moving line" })).toBeInTheDocument();
  });
});
