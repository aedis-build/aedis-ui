import { MediaFrame } from "@/registry/aedis/ui/media-frame";

export default function MediaFrameDemo() {
  return (
    <div className="grid w-full max-w-2xl grid-cols-2 gap-3 sm:grid-cols-3">
      <MediaFrame ratio="4:5" src="/media/work-1.svg" alt="Ceramics studio identity, the shop sign" />
      <MediaFrame ratio="4:5" src="/media/work-3.svg" alt="Bakery website, the home page" fit="contain" />
      <MediaFrame ratio="4:5" alt="Hotel campaign" caption="Photos coming soon" />
    </div>
  );
}
