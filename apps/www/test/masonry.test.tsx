import { render, screen, within } from "@testing-library/react";
import fc from "fast-check";
import { renderToString } from "react-dom/server";

import { interleave, Masonry } from "@/registry/aedis/ui/masonry";
import { MediaFrame } from "@/registry/aedis/ui/media-frame";
import { violations } from "./a11y";

type Work = { src: string; client: string };
const works: Work[] = [
  { src: "/a1.svg", client: "a" },
  { src: "/a2.svg", client: "a" },
  { src: "/a3.svg", client: "a" },
  { src: "/b1.svg", client: "b" },
  { src: "/c1.svg", client: "c" },
  { src: "/c2.svg", client: "c" },
];

const gallery = (groupBy?: (w: Work) => string) => (
  <Masonry aria-label="Work" items={works} itemKey={(w) => w.src} groupBy={groupBy}>
    {(w) => (
      <a href={w.src}>
        <MediaFrame ratio="4:5" src={w.src} alt={`Work ${w.src}`} />
      </a>
    )}
  </Masonry>
);

describe("masonry (#271)", () => {
  it("takes one from each group in turn, each group in its own order", () => {
    expect(interleave(works, (w) => w.client).map((w) => w.src)).toEqual(["/a1.svg", "/b1.svg", "/c1.svg", "/a2.svg", "/c2.svg", "/a3.svg"]);
    expect(interleave([], String)).toEqual([]);
  });

  it("interleaving is a permutation that keeps the order inside each group and never repeats a group while another waits", () => {
    fc.assert(
      fc.property(fc.array(fc.record({ id: fc.nat(), g: fc.constantFrom("a", "b", "c", "d") })), (items) => {
        const out = interleave(items, (i) => i.g);
        expect([...out].sort((x, y) => items.indexOf(x) - items.indexOf(y))).toEqual(items);
        for (const g of "abcd") expect(out.filter((i) => i.g === g)).toEqual(items.filter((i) => i.g === g));
        // In each round every group still holding items gives exactly one.
        const left = new Map<string, number>();
        for (const i of items) left.set(i.g, (left.get(i.g) ?? 0) + 1);
        let at = 0;
        while (at < out.length) {
          const round = [...left].filter(([, n]) => n > 0).map(([g]) => g);
          expect(new Set(out.slice(at, at + round.length).map((i) => i.g))).toEqual(new Set(round));
          for (const g of round) left.set(g, left.get(g)! - 1);
          at += round.length;
        }
      }),
    );
  });

  it("is a named list of links in reading order, laid out by CSS alone on the server", async () => {
    const html = renderToString(gallery((w) => w.client));
    expect(html).toContain("columns-2");
    expect(html).not.toContain("<script");
    const { container } = render(gallery((w) => w.client));
    const list = screen.getByRole("list", { name: "Work" });
    expect(within(list).getAllByRole("link").map((a) => a.getAttribute("href"))).toEqual(["/a1.svg", "/b1.svg", "/c1.svg", "/a2.svg", "/c2.svg", "/a3.svg"]);
    expect(screen.getByRole("link", { name: "Work /b1.svg" })).toBeInTheDocument();
    expect(within(list).getAllByRole("listitem")[0]).toHaveClass("break-inside-avoid");
    expect(await violations(container)).toEqual([]);
  });

  it("keeps the stored order without groupBy, and takes the list's own props", () => {
    render(gallery());
    expect(screen.getAllByRole("link").map((a) => a.getAttribute("href"))).toEqual(works.map((w) => w.src));
  });
});
