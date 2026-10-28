import { MediaFrame } from "@/registry/aedis/ui/media-frame";
import { Parallax, Reveal } from "@/registry/aedis/ui/scroll-motion";

const steps = ["We listen to the brief.", "We sketch three directions.", "We ship the one you choose."];

export default function ScrollMotionDemo() {
  return (
    <div className="grid w-full max-w-xl gap-6 py-[40vh]">
      {steps.map((s, i) => (
        <Reveal key={s} className="rounded-md border border-hairline bg-surface p-4">
          <p className="text-footnote text-muted-foreground">Step {i + 1}</p>
          <p className="text-headline">{s}</p>
        </Reveal>
      ))}
      <div className="overflow-clip rounded-md">
        <Parallax distance={32}>
          <MediaFrame ratio="16:9" src="/media/work-4.svg" alt="Hotel campaign poster" />
        </Parallax>
      </div>
    </div>
  );
}
