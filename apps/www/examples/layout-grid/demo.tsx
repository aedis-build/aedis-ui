import { LayoutGrid, type LayoutGridItem } from "@/registry/aedis/ui/layout-grid";

const film = { kind: "film" as const, src: "/media/showreel.webm", type: "video/webm", poster: "/media/showreel-poster.svg", captions: [{ src: "/media/showreel.vtt", srclang: "en", label: "English", default: true }] };

const hotels: LayoutGridItem[] = [
  { kind: "photo", src: "/media/work-4.svg", ratio: 4 / 3, alt: "Gold light across a hotel lobby", title: "Casa do Largo", label: "Lisbon", description: "A lobby that opens onto the square, lit like late afternoon all day." },
  { ...film, ratio: 9 / 16, alt: "Walking in from the street to the front desk", title: "Arrival", label: "Lisbon", description: "From the door to the key in one shot." },
  { kind: "photo", src: "/media/work-1.svg", ratio: 9 / 16, alt: "Terracotta tiles on a narrow staircase", title: "The stair", label: "Porto" },
  { ...film, ratio: 9 / 16, alt: "Morning light moving over a made bed", title: "Morning", label: "Porto", description: "The room at seven, before anyone is up." },
  { kind: "photo", src: "/media/work-2.svg", ratio: 9 / 16, alt: "Green shutters over a courtyard", title: "Courtyard", label: "Porto" },
  { kind: "photo", src: "/media/work-3.svg", ratio: 9 / 16, alt: "Blue pool tiles seen from above", title: "Pool", label: "Algarve" },
  { ...film, ratio: 16 / 9, alt: "The terrace at dusk, the sea behind", title: "Terrace", label: "Algarve", description: "Dinner outside, the sea doing the lighting." },
];

export default function LayoutGridDemo() {
  return <LayoutGrid chapter={{ number: "01", name: "Coast and city", label: "Hotels" }} items={hotels} className="max-w-4xl" />;
}
