import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Video } from "@/registry/aedis/ui/video";
import { violations } from "./a11y";

const play = vi.fn(function (this: HTMLMediaElement) {
  this.dispatchEvent(new Event("play"));
  return Promise.resolve();
});
const pause = vi.fn(function (this: HTMLMediaElement) {
  this.dispatchEvent(new Event("pause"));
});

function reducedMotion(on: boolean) {
  window.matchMedia = ((q: string) => ({ matches: on && q.includes("reduce"), addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
  reducedMotion(false);
  play.mockClear();
  pause.mockClear();
  Object.assign(HTMLMediaElement.prototype, { play, pause });
});

const captions = [{ src: "/media/showreel.vtt", srclang: "en", label: "English", default: true }];

describe("video (#193)", () => {
  it("is a named player with controls, captions and preload none, and does not autoplay by default", async () => {
    const { container } = render(<Video src="/media/showreel.webm" type="video/webm" title="Showreel 2026" captions={captions} />);
    const video = container.querySelector("video")!;
    expect(video).toHaveAttribute("aria-label", "Showreel 2026");
    expect(video).toHaveAttribute("preload", "none");
    expect(video).toHaveAttribute("controls");
    expect(container.querySelector("track")).toHaveAttribute("kind", "captions");
    expect(container.querySelector("source")).toHaveAttribute("src", "/media/showreel.webm");
    expect(play).not.toHaveBeenCalled();
    expect(await violations(container)).toEqual([]);
  });

  it("autoplays muted when asked, but never under reduced motion", () => {
    const { container, unmount } = render(<Video src="/a.webm" title="Clip" autoplay />);
    expect(play).toHaveBeenCalledTimes(1);
    expect(container.querySelector("video")!.muted).toBe(true);
    unmount();
    play.mockClear();
    reducedMotion(true);
    render(<Video src="/a.webm" title="Clip" autoplay />);
    expect(play).not.toHaveBeenCalled();
  });

  it("background: muted, looped, hidden from assistive tech, with a pause button whenever it moves", async () => {
    const user = userEvent.setup();
    const { container } = render(<Video variant="background" src="/a.webm" title="Studio loop" autoplay />);
    const video = container.querySelector("video")!;
    expect(video).toHaveAttribute("aria-hidden", "true");
    expect(video).toHaveAttribute("loop");
    expect(video).not.toHaveAttribute("controls");
    expect(video.muted).toBe(true);
    await user.click(screen.getByRole("button", { name: "Pause video" }));
    expect(pause).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Play video" })).toBeInTheDocument();
    fireEvent.play(video);
    expect(screen.getByRole("button", { name: "Pause video" })).toBeInTheDocument();
    expect(await violations(container)).toEqual([]);
  });
});
