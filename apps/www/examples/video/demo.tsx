import { Video } from "@/registry/aedis/ui/video";

export default function VideoDemo() {
  return (
    <Video
      src="/media/showreel.webm"
      type="video/webm"
      poster="/media/showreel-poster.svg"
      title="Studio showreel"
      captions={[{ src: "/media/showreel.vtt", srclang: "en", label: "English", default: true }]}
      className="w-full max-w-xl"
    />
  );
}
