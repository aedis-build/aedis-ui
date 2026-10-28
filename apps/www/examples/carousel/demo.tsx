import { Carousel } from "@/registry/aedis/ui/carousel";
import { MediaFrame } from "@/registry/aedis/ui/media-frame";

const works = [
  { src: "/media/work-1.svg", alt: "Ceramics studio identity" },
  { src: "/media/work-2.svg", alt: "Garden centre signage" },
  { src: "/media/work-3.svg", alt: "Bakery website" },
  { src: "/media/work-4.svg", alt: "Hotel campaign" },
];

export default function CarouselDemo() {
  return (
    <Carousel label="Selected work" className="w-full max-w-xl" slideClassName="sm:basis-[calc(50%-0.375rem)]">
      {works.map((w) => (
        <figure key={w.src} className="grid gap-2">
          <MediaFrame ratio="4:5" src={w.src} alt={w.alt} />
          <figcaption className="text-footnote text-muted-foreground">{w.alt}</figcaption>
        </figure>
      ))}
    </Carousel>
  );
}
