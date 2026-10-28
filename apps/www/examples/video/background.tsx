import { Video } from "@/registry/aedis/ui/video";

export default function VideoBackground() {
  return (
    <div className="relative h-64 w-full max-w-xl overflow-hidden rounded-md">
      <Video variant="background" autoplay src="/media/showreel.webm" type="video/webm" poster="/media/showreel-poster.svg" title="Studio loop" className="absolute inset-0 rounded-none" />
      <p className="absolute top-4 left-4 rounded-sm bg-surface/85 px-3 py-1.5 text-headline">Light, shape, motion.</p>
    </div>
  );
}
