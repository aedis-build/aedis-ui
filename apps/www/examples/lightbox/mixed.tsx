import { Lightbox, type LightboxItem } from "@/registry/aedis/ui/lightbox";

const works: LightboxItem[] = [
  { src: "/media/work-1.svg", alt: "Terracotta shop sign", title: "Ceramics studio", caption: "Identity and signage, 2026" },
  {
    kind: "video",
    src: "/media/showreel.webm",
    type: "video/webm",
    poster: "/media/showreel-frame.jpg",
    width: 640,
    height: 360,
    alt: "Studio showreel",
    title: "Studio film",
    caption: "Showreel, 2026",
    captions: [{ src: "/media/showreel.vtt", srclang: "en", label: "English", default: true }],
  },
  { src: "/media/work-4.svg", alt: "Gold hotel poster", title: "Hotel campaign", caption: "Print campaign, 2025" },
];

export default function LightboxMixed() {
  return <Lightbox items={works} ratio="1:1" className="w-full max-w-xl" />;
}
