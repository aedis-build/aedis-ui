import { TextMask } from "@/registry/aedis/ui/text-mask";

export default function TextMaskDemo() {
  return (
    <div className="grid w-full max-w-3xl gap-4">
      <TextMask text="STUDIO" label="Studio" image="/media/work-1.svg" className="rounded-md" />
      <TextMask text="FILM" label="Film" video="/media/showreel.webm" poster="/media/showreel-poster.svg" className="rounded-md" />
    </div>
  );
}
