import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Lightbox, type LightboxItem } from "@/registry/aedis/ui/lightbox";
import { violations } from "./a11y";

const items = [
  { src: "/media/work-1.svg", alt: "Shop sign in terracotta", title: "Ceramics studio", caption: "Identity, 2026" },
  { src: "/media/work-2.svg", alt: "Signage by the greenhouse", title: "Garden centre" },
  { src: "/media/work-3.svg", alt: "Home page on a phone", title: "Bakery website" },
];

describe("lightbox (#195)", () => {
  it("opens the clicked item as a dialog named by its title, with a counter", async () => {
    const user = userEvent.setup();
    const { container } = render(<Lightbox items={items} />);
    expect(await violations(container)).toEqual([]);
    await user.click(screen.getByRole("button", { name: "Signage by the greenhouse" }));
    const dialog = await screen.findByRole("dialog", { name: "Garden centre" });
    expect(dialog).toHaveTextContent("2 of 3");
    expect(screen.getByRole("img", { name: "Signage by the greenhouse" })).toBeVisible();
    expect(await violations(dialog)).toEqual([]);
  });

  it("moves with the arrow keys and the buttons, wrapping around", async () => {
    const user = userEvent.setup();
    render(<Lightbox items={items} />);
    await user.click(screen.getByRole("button", { name: "Shop sign in terracotta" }));
    const dialog = await screen.findByRole("dialog", { name: "Ceramics studio" });
    // The dialog moves the focus in after a frame; keys pressed before that land on the thumbnail.
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("dialog", { name: "Bakery website" })).toHaveTextContent("3 of 3");
    await user.keyboard("{ArrowRight}");
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("dialog", { name: "Garden centre" })).toBeInTheDocument();
  });

  it("wraps Tab at the edges, so the focus never leaves the open dialog", async () => {
    const user = userEvent.setup();
    render(<Lightbox items={items} />);
    await user.click(screen.getByRole("button", { name: "Shop sign in terracotta" }));
    const dialog = await screen.findByRole("dialog");
    screen.getByRole("button", { name: "Next" }).focus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole("button", { name: "Next" })).toHaveFocus();
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it("closes with Esc and gives the focus back to the thumbnail that opened it", async () => {
    const user = userEvent.setup();
    render(<Lightbox items={items} />);
    const thumb = screen.getByRole("button", { name: "Home page on a phone" });
    await user.click(thumb);
    await screen.findByRole("dialog");
    await user.keyboard("{ArrowRight}{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(thumb).toHaveFocus();
  });
});

const mixed: LightboxItem[] = [
  { src: "/w/sign-1600.jpg", srcSet: "/w/sign-640.jpg 640w, /w/sign-1600.jpg 1600w", sizes: "90vw", width: 1600, height: 2000, alt: "Shop sign", title: "Ceramics studio" },
  {
    kind: "video",
    src: "/w/reel.webm",
    type: "video/webm",
    poster: "/w/reel.jpg",
    alt: "Studio showreel",
    title: "Studio film",
    captions: [{ src: "/w/reel.vtt", srclang: "en", label: "English" }],
  },
  { src: "/w/poster.jpg", alt: "Hotel poster", title: "Hotel campaign" },
];

describe("lightbox with films and responsive images (#269)", () => {
  afterEach(() => vi.restoreAllMocks());

  it("names a film's thumbnail as a video and shows its poster", async () => {
    const { container } = render(<Lightbox items={mixed} />);
    const thumb = screen.getByRole("button", { name: "Studio showreel video" });
    expect(thumb.querySelector("img")).toHaveAttribute("src", "/w/reel.jpg");
    expect(await violations(container)).toEqual([]);
  });

  it("gives the thumbnail and the open image the srcSet, with the thumbnail's sizes and the item's", async () => {
    const user = userEvent.setup();
    render(<Lightbox items={mixed} />);
    const thumb = screen.getByRole("button", { name: "Shop sign" });
    expect(thumb.querySelector("img")).toHaveAttribute("srcset", "/w/sign-640.jpg 640w, /w/sign-1600.jpg 1600w");
    expect(thumb.querySelector("img")).toHaveAttribute("sizes", "(min-width: 640px) 33vw, 50vw");
    expect(screen.getByRole("button", { name: "Hotel poster" }).querySelector("img")).not.toHaveAttribute("sizes");
    await user.click(thumb);
    const dialog = await screen.findByRole("dialog", { name: "Ceramics studio" });
    const open = within(dialog).getByRole("img", { name: "Shop sign" });
    expect(open).toHaveAttribute("sizes", "90vw");
    expect(open).toHaveAttribute("width", "1600");
  });

  it("takes the thumbnails' sizes from thumbSizes", () => {
    render(<Lightbox items={mixed} thumbSizes="120px" />);
    expect(screen.getByRole("button", { name: "Shop sign" }).querySelector("img")).toHaveAttribute("sizes", "120px");
  });

  it("puts behind the open image the file the thumbnail actually showed", async () => {
    const user = userEvent.setup();
    render(<Lightbox items={mixed} />);
    const thumb = screen.getByRole("button", { name: "Shop sign" });
    Object.defineProperty(thumb.querySelector("img")!, "currentSrc", { value: "/w/sign-640.jpg" });
    await user.click(thumb);
    const dialog = await screen.findByRole("dialog", { name: "Ceramics studio" });
    expect(dialog.querySelector('[data-slot="lightbox-behind"]')).toHaveAttribute("src", "/w/sign-640.jpg");
  });

  it("drops the thumbnail behind when the large file fails, so its alt shows", async () => {
    const user = userEvent.setup();
    render(<Lightbox items={mixed} />);
    await user.click(screen.getByRole("button", { name: "Hotel poster" }));
    const dialog = await screen.findByRole("dialog", { name: "Hotel campaign" });
    fireEvent.error(within(dialog).getByRole("img", { name: "Hotel poster" }));
    expect(dialog.querySelector('[data-slot="lightbox-behind"]')).toBeNull();
  });

  it("leaves ← → to the player while it has the focus, and Shift+Tab goes back from it to the buttons above", async () => {
    const user = userEvent.setup();
    render(<Lightbox items={mixed} />);
    await user.click(screen.getByRole("button", { name: "Studio showreel video" }));
    const dialog = await screen.findByRole("dialog", { name: "Studio film" });
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    const video = dialog.querySelector("video")!;
    video.tabIndex = 0; // jsdom does not make a video with controls focusable, as browsers do.
    video.focus();
    expect(video).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("dialog", { name: "Studio film" })).toBeInTheDocument();
    await user.tab({ shift: true });
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
  });

  it("shows the thumbnail behind the large image until it loads", async () => {
    const user = userEvent.setup();
    render(<Lightbox items={mixed} />);
    await user.click(screen.getByRole("button", { name: "Hotel poster" }));
    const dialog = await screen.findByRole("dialog", { name: "Hotel campaign" });
    const behind = dialog.querySelector('[data-slot="lightbox-behind"]');
    expect(behind).toHaveAttribute("src", "/w/poster.jpg");
    expect(behind).toHaveAttribute("aria-hidden", "true");
    fireEvent.load(within(dialog).getByRole("img", { name: "Hotel poster" }));
    expect(dialog.querySelector('[data-slot="lightbox-behind"]')).toBeNull();
  });

  it("opens a film in the player, named by its alt, with controls and captions, without playing it", async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    const user = userEvent.setup();
    render(<Lightbox items={mixed} />);
    await user.click(screen.getByRole("button", { name: "Studio showreel video" }));
    const dialog = await screen.findByRole("dialog", { name: "Studio film" });
    const video = dialog.querySelector("video")!;
    expect(video).toHaveAttribute("aria-label", "Studio showreel");
    expect(video).toHaveAttribute("controls");
    expect(video).toHaveAttribute("poster", "/w/reel.jpg");
    expect(video.muted).toBe(false);
    expect(video.querySelector("track")).toHaveAttribute("src", "/w/reel.vtt");
    expect(play).not.toHaveBeenCalled();
    expect(await violations(dialog)).toEqual([]);
  });

  it("gives the player the film's shape, 16:9 when the item does not say", async () => {
    const user = userEvent.setup();
    render(<Lightbox items={[{ ...(mixed[1] as LightboxItem & { kind: "video" }), width: 4, height: 3 }, { ...(mixed[1] as LightboxItem & { kind: "video" }), src: "/w/b.webm", title: "Other" }]} />);
    await user.click(screen.getAllByRole("button", { name: "Studio showreel video" })[0]!);
    const dialog = await screen.findByRole("dialog", { name: "Studio film" });
    expect(dialog.querySelector<HTMLElement>('[data-slot="lightbox-player"]')!.style.aspectRatio).toBe("4 / 3");
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    await user.keyboard("{ArrowRight}");
    const next = await screen.findByRole("dialog", { name: "Other" });
    expect(next.querySelector<HTMLElement>('[data-slot="lightbox-player"]')!.style.aspectRatio).toBe("16 / 9");
  });

  it("passes only the film's file, poster and tracks to the player, so item data cannot turn on autoplay", async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    const untrusted = { ...mixed[1], autoplay: true, variant: "background" } as unknown as LightboxItem;
    const user = userEvent.setup();
    render(<Lightbox items={[untrusted]} />);
    await user.click(screen.getByRole("button", { name: "Studio showreel video" }));
    const video = (await screen.findByRole("dialog", { name: "Studio film" })).querySelector("video")!;
    expect(video).toHaveAttribute("controls");
    expect(video).not.toHaveAttribute("aria-hidden");
    expect(video.muted).toBe(false);
    expect(play).not.toHaveBeenCalled();
  });

  it("pauses the film when the item changes and when the lightbox closes", async () => {
    const pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    const user = userEvent.setup();
    render(<Lightbox items={mixed} />);
    await user.click(screen.getByRole("button", { name: "Studio showreel video" }));
    const dialog = await screen.findByRole("dialog", { name: "Studio film" });
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    await user.keyboard("{ArrowRight}");
    expect(pause).toHaveBeenCalledTimes(1);
    await user.keyboard("{ArrowLeft}");
    await screen.findByRole("dialog", { name: "Studio film" });
    await user.keyboard("{Escape}");
    expect(pause).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
});

describe("lightbox shared element and drag to close (#270)", () => {
  const media = () => document.querySelector<HTMLElement>('[data-slot="lightbox-media"]');
  const stage = () => document.querySelector<HTMLElement>('[data-slot="lightbox-stage"]')!;
  const overlay = () => document.querySelector<HTMLElement>('[data-slot="dialog-overlay"]')!;
  const reduce = () => vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("reduce"), addEventListener: () => {}, removeEventListener: () => {} }));
  // jsdom has no View Transitions: a stand-in that records which element carries the name before and after the change.
  const transitions = () => {
    const names: { before: string[]; after: string[] }[] = [];
    const named = () => [...document.querySelectorAll<HTMLElement>("*")].filter((el) => el.style.viewTransitionName === "lightbox-item").map((el) => el.dataset.slot ?? el.tagName.toLowerCase());
    const start = vi.fn((update: () => void) => {
      const before = named();
      update();
      names.push({ before, after: named() });
      return { finished: Promise.resolve() };
    });
    Object.defineProperty(document, "startViewTransition", { value: start, configurable: true });
    return { start, names, named };
  };
  const drag = (to: number) => {
    fireEvent.pointerDown(stage(), { pointerId: 1, button: 0, clientY: 100 });
    fireEvent.pointerMove(stage(), { pointerId: 1, clientY: 100 + to });
  };

  afterEach(() => {
    delete (document as { startViewTransition?: unknown }).startViewTransition;
    vi.unstubAllGlobals();
  });

  it("morphs from the thumbnail to the open item and back, then gives the focus back to the thumbnail", async () => {
    const vt = transitions();
    const user = userEvent.setup();
    render(<Lightbox items={items} zoomFromThumbnail />);
    const thumb = screen.getByRole("button", { name: "Signage by the greenhouse" });
    await user.click(thumb);
    await screen.findByRole("dialog", { name: "Garden centre" });
    expect(vt.names[0]).toEqual({ before: ["button"], after: ["lightbox-media"] });
    await waitFor(() => expect(vt.named()).toEqual([]));
    await user.keyboard("{Escape}");
    expect(vt.names[1]).toEqual({ before: ["lightbox-media"], after: ["button"] });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(thumb).toHaveFocus();
    expect(vt.named()).toEqual([]);
  });

  it("after moving to another item, closing shrinks it into that item's thumbnail; the focus still goes to the one that opened", async () => {
    const vt = transitions();
    const user = userEvent.setup();
    render(<Lightbox items={items} zoomFromThumbnail />);
    const first = screen.getByRole("button", { name: "Shop sign in terracotta" });
    const third = screen.getByRole("button", { name: "Home page on a phone" });
    await user.click(first);
    const dialog = await screen.findByRole("dialog", { name: "Ceramics studio" });
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    await user.keyboard("{ArrowRight}{ArrowRight}");
    await screen.findByRole("dialog", { name: "Bakery website" });
    const start = vt.start.mock.calls.length;
    vt.start.mockImplementationOnce((update: () => void) => {
      const before = vt.named();
      update();
      // Which thumbnail the item flies back to, by element, not by tag.
      expect([...document.querySelectorAll<HTMLElement>("*")].filter((el) => el.style.viewTransitionName === "lightbox-item")).toEqual([third]);
      vt.names.push({ before, after: vt.named() });
      return { finished: Promise.resolve() };
    });
    await user.keyboard("{Escape}");
    expect(vt.start).toHaveBeenCalledTimes(start + 1);
    expect(vt.names.at(-1)).toEqual({ before: ["lightbox-media"], after: ["button"] });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(first).toHaveFocus();
  });

  it("opens at once where there are no view transitions, without zoomFromThumbnail, and under reduced motion", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Lightbox items={items} zoomFromThumbnail />);
    await user.click(screen.getByRole("button", { name: "Shop sign in terracotta" }));
    expect(await screen.findByRole("dialog", { name: "Ceramics studio" })).toBeInTheDocument();
    unmount();
    const vt = transitions();
    const plain = render(<Lightbox items={items} />);
    await user.click(screen.getByRole("button", { name: "Shop sign in terracotta" }));
    await screen.findByRole("dialog");
    plain.unmount();
    reduce();
    render(<Lightbox items={items} zoomFromThumbnail />);
    await user.click(screen.getByRole("button", { name: "Shop sign in terracotta" }));
    await screen.findByRole("dialog");
    expect(vt.start).not.toHaveBeenCalled();
  });

  it("follows a drag down and fades the backdrop; short of 120 px it springs back and stays open", async () => {
    const user = userEvent.setup();
    render(<Lightbox items={items} />);
    await user.click(screen.getByRole("button", { name: "Shop sign in terracotta" }));
    await screen.findByRole("dialog");
    drag(60);
    expect(media()!.style.translate).toBe("0px 60px");
    expect(Number(overlay().style.opacity)).toBeLessThan(1);
    // The fade follows the finger: no transition lags behind it while dragging.
    expect(overlay().style.transition).toBe("none");
    fireEvent.pointerUp(stage(), { pointerId: 1, clientY: 160 });
    expect(media()!.style.translate).toBe("");
    expect(overlay().style.opacity).toBe("");
    // The backdrop comes back on the item's spring, not in one jump.
    expect(overlay().style.transition).toBe("opacity var(--duration-spring) var(--ease-spring-bouncy)");
    expect(media()!.style.transition).toBe("translate var(--duration-spring) var(--ease-spring-bouncy)");
    fireEvent.transitionEnd(overlay());
    expect(overlay().style.transition).toBe("");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes when let go past 120 px, and the focus goes back to the thumbnail", async () => {
    const user = userEvent.setup();
    render(<Lightbox items={items} />);
    const thumb = screen.getByRole("button", { name: "Home page on a phone" });
    await user.click(thumb);
    await screen.findByRole("dialog");
    drag(150);
    const o = overlay();
    fireEvent.pointerUp(stage(), { pointerId: 1, clientY: 250 });
    // It fades on from the dragged opacity; it is never reset to opaque on the way out.
    expect(o.style.opacity).toBe("0");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(thumb).toHaveFocus();
  });

  it("under reduced motion the item does not follow the pointer, but letting go past 120 px still closes", async () => {
    reduce();
    const user = userEvent.setup();
    render(<Lightbox items={items} />);
    await user.click(screen.getByRole("button", { name: "Shop sign in terracotta" }));
    await screen.findByRole("dialog");
    drag(150);
    expect(media()!.style.translate).toBe("");
    expect(overlay().style.opacity).toBe("");
    fireEvent.pointerUp(stage(), { pointerId: 1, clientY: 250 });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("leaves presses on the film to its controls: a drag that starts on the video does nothing", async () => {
    const user = userEvent.setup();
    render(<Lightbox items={mixed} />);
    await user.click(screen.getByRole("button", { name: "Studio showreel video" }));
    const dialog = await screen.findByRole("dialog", { name: "Studio film" });
    const video = dialog.querySelector("video")!;
    fireEvent.pointerDown(video, { pointerId: 1, button: 0, clientY: 100 });
    fireEvent.pointerMove(video, { pointerId: 1, clientY: 300 });
    fireEvent.pointerUp(video, { pointerId: 1, clientY: 300 });
    expect(media()!.style.translate).toBe("");
    expect(screen.getByRole("dialog", { name: "Studio film" })).toBeInTheDocument();
  });

  it("blurs the page behind with backdrop=\"blur\", and stays accessible", async () => {
    const user = userEvent.setup();
    render(<Lightbox items={items} backdrop="blur" />);
    await user.click(screen.getByRole("button", { name: "Shop sign in terracotta" }));
    const dialog = await screen.findByRole("dialog");
    expect(overlay()).toHaveClass("backdrop-blur-(--blur-regular)", "bg-scrim");
    expect(await violations(dialog)).toEqual([]);
  });

  it("lays the thumbnails out in masonry, each with its own shape or the ratio as fallback", async () => {
    const user = userEvent.setup();
    const shaped = [
      { ...items[0]!, width: 800, height: 1000, group: "a" },
      { ...items[1]!, width: 1200, height: 800, group: "b" },
      { ...items[2]!, group: "a" },
    ];
    const { container } = render(<Lightbox items={shaped} layout="masonry" />);
    expect(await violations(container)).toEqual([]);
    expect(container.querySelector("ul[data-slot=lightbox] > li[data-slot=masonry-item]")).toBeInTheDocument();
    // Interleaved by group: a, b, a keeps items 0, 1, 2 here; the frame takes the item's width/height.
    const frames = [...container.querySelectorAll("[data-slot=media-frame]")];
    expect(frames[0]).toHaveStyle({ aspectRatio: "800 / 1000" });
    expect(frames[1]).toHaveStyle({ aspectRatio: "1200 / 800" });
    expect(frames[2]).toHaveAttribute("data-ratio", "4:5");
    await user.click(screen.getByRole("button", { name: "Home page on a phone" }));
    expect(await screen.findByRole("dialog", { name: "Bakery website" })).toHaveTextContent("3 of 3");
  });

  it("interleaving the masonry thumbnails does not change which item a thumbnail opens", async () => {
    const user = userEvent.setup();
    const grouped = [
      { ...items[0]!, group: "a" },
      { ...items[1]!, group: "a" },
      { ...items[2]!, group: "b" },
    ];
    const { container } = render(<Lightbox items={grouped} layout="masonry" />);
    // a, a, b becomes a, b, a on the page.
    const names = [...container.querySelectorAll("button")].map((b) => b.querySelector("img")!.alt);
    expect(names).toEqual(["Shop sign in terracotta", "Home page on a phone", "Signage by the greenhouse"]);
    await user.click(screen.getByRole("button", { name: "Signage by the greenhouse" }));
    expect(await screen.findByRole("dialog", { name: "Garden centre" })).toHaveTextContent("2 of 3");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.getByRole("button", { name: "Signage by the greenhouse" })).toHaveFocus());
  });
});
