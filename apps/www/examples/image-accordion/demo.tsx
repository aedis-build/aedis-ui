import { Button } from "@/registry/aedis/ui/button";
import { ImageAccordion } from "@/registry/aedis/ui/image-accordion";

const items = [
  { image: "/media/work-1.svg", alt: "Terracotta shop sign", kicker: "Principle", label: "Craft", text: "Every mark is drawn by hand before it is drawn on screen." },
  { image: "/media/work-2.svg", alt: "Green signage by a greenhouse door", kicker: "Principle", label: "Place", text: "We start where the brand lives: the street, the shelf, the lobby." },
  { image: "/media/work-3.svg", alt: "Blue home page on a phone", kicker: "Principle", label: "Use", text: "A system is only finished when the team runs it without us." },
  { image: "/media/work-4.svg", alt: "Gold poster in a hotel lobby", kicker: "Moment 1", label: "Listen", text: "Two weeks with the people who make and sell the work." },
  { image: "/media/showreel-poster.svg", alt: "Still from the studio showreel", kicker: "Moment 2", label: "Shape", text: "Three directions, tested on real signs and pages, never mood boards." },
  { image: "/media/work-1.svg", alt: "The finished sign, in place", kicker: "Moment 3", label: "Hand over", text: "Files, guides and a day of training, so it keeps its shape." },
];

export default function ImageAccordionDemo() {
  return (
    <div className="grid w-full items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.4fr)]">
      <div className="grid content-start gap-4">
        <h2 className="text-title-1">The studio</h2>
        <p className="text-callout text-muted-foreground">Three principles we keep, and the three moments every project goes through.</p>
        <Button shape="pill" className="justify-self-start">
          Talk to us
        </Button>
      </div>
      <ImageAccordion aria-label="Principles and process" items={items} />
    </div>
  );
}
