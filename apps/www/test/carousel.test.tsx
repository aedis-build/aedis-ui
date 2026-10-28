import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Carousel, Slideshow } from "@/registry/aedis/ui/carousel";
import { violations } from "./a11y";

const works = ["Shop sign", "Home page", "Catalogue"].map((w) => <p key={w}>{w}</p>);

function reducedMotion(on: boolean) {
  window.matchMedia = ((q: string) => ({ matches: on && q.includes("reduce"), addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
}

beforeEach(() => reducedMotion(false));
afterEach(() => vi.useRealTimers());

const current = () => screen.getAllByRole("group").find((g) => !g.hasAttribute("inert"))!;

describe("carousel (#192)", () => {
  it("names itself and each slide n of m, makes hidden slides inert, and has no autoplay by default", async () => {
    vi.useFakeTimers();
    const { container } = render(<Carousel label="Selected work">{works}</Carousel>);
    expect(screen.getByRole("region", { name: "Selected work" })).toHaveAttribute("aria-roledescription", "carousel");
    expect(screen.getAllByRole("group").map((g) => g.getAttribute("aria-label"))).toEqual(["1 of 3", "2 of 3", "3 of 3"]);
    expect(current()).toHaveTextContent("Shop sign");
    expect(screen.queryByRole("button", { name: "Pause" })).toBeNull();
    act(() => vi.advanceTimersByTime(20000));
    expect(current()).toHaveTextContent("Shop sign");
    vi.useRealTimers();
    expect(await violations(container)).toEqual([]);
  });

  it("moves with previous and next, wrapping around", async () => {
    const user = userEvent.setup();
    render(<Carousel label="Selected work">{works}</Carousel>);
    await user.click(screen.getByRole("button", { name: "Next slide" }));
    expect(current()).toHaveTextContent("Home page");
    await user.click(screen.getByRole("button", { name: "Previous slide" }));
    await user.click(screen.getByRole("button", { name: "Previous slide" }));
    expect(current()).toHaveTextContent("Catalogue");
  });
});

describe("autoplay (#192)", () => {
  it("advances every interval with a pause button first in the tab order, and pauses for good", () => {
    vi.useFakeTimers();
    render(
      <Slideshow label="Showreel" autoplay interval={3000}>
        {works}
      </Slideshow>,
    );
    const pause = screen.getByRole("button", { name: "Pause" });
    expect(screen.getAllByRole("button")[0]).toBe(pause);
    act(() => vi.advanceTimersByTime(3000));
    expect(current()).toHaveTextContent("Home page");
    fireEvent.click(pause);
    fireEvent.blur(screen.getByRole("button", { name: "Play" }));
    act(() => vi.advanceTimersByTime(9000));
    expect(current()).toHaveTextContent("Home page");
  });

  it("holds while hovered or focused, and while the tab is hidden", () => {
    vi.useFakeTimers();
    render(
      <Slideshow label="Showreel" autoplay interval={1000}>
        {works}
      </Slideshow>,
    );
    const region = screen.getByRole("region", { name: "Showreel" });
    fireEvent.pointerEnter(region);
    act(() => vi.advanceTimersByTime(5000));
    expect(current()).toHaveTextContent("Shop sign");
    fireEvent.pointerLeave(region);
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    act(() => void document.dispatchEvent(new Event("visibilitychange")));
    act(() => vi.advanceTimersByTime(5000));
    expect(current()).toHaveTextContent("Shop sign");
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
    act(() => void document.dispatchEvent(new Event("visibilitychange")));
    act(() => vi.advanceTimersByTime(1000));
    expect(current()).toHaveTextContent("Home page");
  });

  it("never runs under reduced motion, and then shows no pause button", () => {
    reducedMotion(true);
    vi.useFakeTimers();
    render(
      <Carousel label="Selected work" autoplay interval={1000}>
        {works}
      </Carousel>,
    );
    expect(screen.queryByRole("button", { name: "Pause" })).toBeNull();
    act(() => vi.advanceTimersByTime(10000));
    expect(current()).toHaveTextContent("Shop sign");
  });
});

describe("slideshow (#192)", () => {
  it("shows one slide at a time and swipes on touch", async () => {
    const { container } = render(<Slideshow label="Showreel">{works}</Slideshow>);
    const stage = container.querySelector(".touch-pan-y")!;
    fireEvent.pointerDown(stage, { pointerType: "touch", clientX: 300 });
    fireEvent.pointerUp(stage, { pointerType: "touch", clientX: 200 });
    expect(current()).toHaveTextContent("Home page");
    expect(screen.getAllByRole("group").filter((g) => !g.hasAttribute("inert"))).toHaveLength(1);
    expect(await violations(container)).toEqual([]);
  });
});
