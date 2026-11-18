import { MediaFrame } from "@/registry/aedis/ui/media-frame";

export default function MediaFrameDemo() {
  return (
    <div className="grid w-full max-w-2xl grid-cols-2 items-start gap-3 sm:grid-cols-3">
      <MediaFrame ratio="4:5" src="/media/work-1.svg" alt="Ceramics studio identity, the shop sign" />
      <MediaFrame ratio="4:5" src="/media/work-3.svg" alt="Bakery website, the home page" fit="contain" />
      <MediaFrame ratio="4:5" alt="Hotel campaign" caption="Photos coming soon" />
      <MediaFrame ratio="2:3" src="/media/work-2.svg" alt="Greenhouse signage, portrait" />
      <MediaFrame ratio="9:16" src="/media/work-4.svg" alt="Hotel campaign reel, cover" />
      <MediaFrame width={1600} height={1000} src="/media/showreel-poster.svg" alt="Studio showreel, still at its own 1600 × 1000 size" />
    </div>
  );
}
