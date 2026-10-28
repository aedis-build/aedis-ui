import { CopyButton } from "@/registry/aedis/ui/copy-button";

const link = "https://rlfn.studio/p/ana-ceramics";

export default function CopyButtonDemo() {
  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <p className="text-callout font-medium">Your portfolio link</p>
      <div className="flex min-w-0 items-center gap-2 rounded-sm border border-hairline bg-surface py-1 pr-1 pl-3">
        <span className="min-w-0 flex-1 truncate font-mono text-footnote">{link}</span>
        <CopyButton value={link} size="sm">
          Copy link
        </CopyButton>
      </div>
    </div>
  );
}
