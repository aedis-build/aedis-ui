import { TextMask } from "@/registry/aedis/ui/text-mask";

// The camera flies through the stem of the L until the picture fills the screen.
export default function TextMaskFly() {
  return <TextMask text="RLFN" label="RLFN Studio" image="/media/work-4.svg" fly={{ glyph: 1, origin: [0.2, 0.5], track: 2 }} className="rounded-md" />;
}
