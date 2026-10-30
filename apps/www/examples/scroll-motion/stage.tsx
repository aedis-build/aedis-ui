import { MediaFrame } from "@/registry/aedis/ui/media-frame";
import { ScrollStage, StageLayer } from "@/registry/aedis/ui/scroll-motion";

// A dark screening room in every theme: the text is on-media over a media scrim, at any point of the scroll.
export default function ScrollMotionStage() {
  return (
    <ScrollStage track={3} aria-label="Premiere" className="w-full rounded-md bg-media-scrim-strong text-on-media">
      <StageLayer at={[0.6, 1.4]} from={{ transform: "scale(1)", borderRadius: "0px" }} to={{ transform: "scale(0.4)", borderRadius: "24px" }} className="overflow-hidden">
        <MediaFrame ratio="16:9" src="/media/showreel-poster.svg" alt="Still from the studio showreel" className="h-full" />
      </StageLayer>
      <StageLayer at={[0, 1]} from={{ transform: "scale(1)", opacity: 1 }} to={{ transform: "scale(12)", opacity: 0 }} className="grid place-items-center bg-media-scrim">
        <p className="text-display font-semibold">Premiere</p>
      </StageLayer>
      <StageLayer at={[0, 0.5]} from={{ opacity: 1 }} to={{ opacity: 0 }} className="grid items-end p-6">
        <p className="text-callout">Scroll to open the screen.</p>
      </StageLayer>
      <StageLayer at={[1.4, 1.9]} from={{ opacity: 0, transform: "translateY(32px)", filter: "blur(6px)" }} to={{ opacity: 1, transform: "none", filter: "none" }} className="grid items-start p-6">
        <p data-part="next" className="text-title-2">Now showing: the studio, in three acts.</p>
      </StageLayer>
    </ScrollStage>
  );
}
