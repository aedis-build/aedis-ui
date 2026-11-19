import { Lightbox, type LightboxItem } from "@/registry/aedis/ui/lightbox";

// Each thumbnail keeps its item's own width and height; the year, the end of the caption, is the group.
const works: LightboxItem[] = [
  { src: "/media/work-1.svg", width: 800, height: 1000, alt: "Terracotta shop sign", title: "Ceramics studio", caption: "Identity and signage, 2026" },
  { src: "/media/work-2.svg", width: 800, height: 1200, alt: "Greenhouse wayfinding sign", title: "Garden centre", caption: "Wayfinding, 2025" },
  { src: "/media/work-3.svg", width: 1200, height: 800, alt: "Bakery home page on a phone", title: "Bakery website", caption: "Website and ordering, 2026" },
  { src: "/media/work-4.svg", width: 800, height: 800, alt: "Gold hotel lobby poster", title: "Hotel campaign", caption: "Print campaign, 2025" },
  { src: "/media/work-1.svg#card", width: 1600, height: 900, alt: "Ceramics studio business card", title: "Studio card", caption: "Stationery, 2026" },
  { src: "/media/work-4.svg#key", width: 800, height: 1000, alt: "Hotel key card", title: "Key card", caption: "Print, 2025" },
];

export default function LightboxMasonry() {
  return <Lightbox items={works} layout="masonry" groupBy={(it) => it.caption?.slice(-4) ?? ""} zoomFromThumbnail className="w-full" />;
}
