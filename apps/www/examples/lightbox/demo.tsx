import { Lightbox } from "@/registry/aedis/ui/lightbox";

const works = [
  { src: "/media/work-1.svg", alt: "Shop sign in terracotta and cream", title: "Ceramics studio", caption: "Identity and signage, 2026" },
  { src: "/media/work-2.svg", alt: "Green signage by the greenhouse door", title: "Garden centre", caption: "Wayfinding, 2025" },
  { src: "/media/work-3.svg", alt: "Blue home page on a phone", title: "Bakery website", caption: "Website and ordering, 2026" },
  { src: "/media/work-4.svg", alt: "Gold poster in a hotel lobby", title: "Hotel campaign", caption: "Print campaign, 2025" },
];

export default function LightboxDemo() {
  return <Lightbox items={works} zoomFromThumbnail className="w-full max-w-xl sm:grid-cols-4" />;
}
