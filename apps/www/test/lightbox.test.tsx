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
