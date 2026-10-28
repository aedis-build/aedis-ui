import { Slideshow } from "@/registry/aedis/ui/carousel";

const frames = [
  { src: "/media/work-1.svg", alt: "Ceramics studio identity" },
  { src: "/media/work-3.svg", alt: "Bakery website" },
  { src: "/media/work-4.svg", alt: "Hotel campaign" },
];

export default function CarouselSlideshow() {
  return (
    <Slideshow label="Showreel" autoplay interval={4000} className="h-72 w-full max-w-xl rounded-md">
      {frames.map((f) => (
        <img key={f.src} src={f.src} alt={f.alt} className="size-full object-cover" />
      ))}
    </Slideshow>
  );
}
