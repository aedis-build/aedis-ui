"use client";

import { Pin } from "@/registry/aedis/ui/scroll-motion";
import { SectionDock } from "@/registry/aedis/ui/section-dock";

const chapters = [
  { id: "dock-opening", label: "Opening", text: "The studio in one sentence, and the film behind it." },
  { id: "dock-work", label: "Work", text: "Six projects, each told in a picture and a line." },
  { id: "dock-house", label: "The house", text: "Three principles and the three moments of every project." },
  { id: "dock-services", label: "Services", text: "What we do, from the first mark to the last template." },
  { id: "dock-contact", label: "Contact", text: "A short form, and a person who answers it." },
];

// A long page of chapters, one of them a sticky scene: the dock (bottom corner) follows them as the page scrolls.
export default function SectionDockDemo() {
  return (
    <div className="grid w-full max-w-xl gap-0">
      {chapters.map((c) =>
        c.id === "dock-house" ? (
          <section key={c.id} id={c.id} data-chapter={c.label} className="scroll-mt-20">
            <Pin length={1.5}>
              {(progress) => (
                <div className="grid h-svh content-center gap-3 pr-14">
                  <p className="text-title-2">{c.label}</p>
                  <p className="text-callout text-muted-foreground">{c.text}</p>
                  <p className="text-footnote text-muted-foreground">A sticky scene: {Math.round(progress * 100)}% through.</p>
                </div>
              )}
            </Pin>
          </section>
        ) : (
          <section key={c.id} id={c.id} data-chapter={c.label} className="grid min-h-[90svh] scroll-mt-20 content-center gap-3 border-t border-hairline pr-14">
            <p className="text-title-2">{c.label}</p>
            <p className="text-callout text-muted-foreground">{c.text}</p>
          </section>
        ),
      )}
      <SectionDock action={{ label: "Talk to us", href: "#dock-contact" }} />
    </div>
  );
}
