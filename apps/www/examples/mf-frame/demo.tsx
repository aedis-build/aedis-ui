"use client";

import * as React from "react";

import { REMOTE_PATH, shellMessages } from "@/content/mf-demo";
import { MfFrame, RESIZE } from "@/registry/aedis/ui/mf-frame";

/** The billing remote of this site in an MfFrame: sandboxed, sized by the height it reports over the bridge. */
export default function MfFrameDemo() {
  const [src, setSrc] = React.useState<string | null>(null);
  const [height, setHeight] = React.useState<number | null>(null);
  React.useEffect(() => setSrc(`${window.location.origin}${REMOTE_PATH}`), []);
  return (
    <div className="grid w-full max-w-xl gap-2">
      {src ? (
        <MfFrame
          src={src}
          title="Billing remote"
          messages={shellMessages}
          minHeight={160}
          maxHeight={600}
          onBridge={(bridge) => void bridge.on(RESIZE as never, (p) => setHeight(Math.round((p as { height: number }).height)))}
        />
      ) : (
        <div className="h-40" />
      )}
      <p role="status" className="text-footnote text-muted-foreground">
        {height ? `The remote reported ${height} px; the frame follows it.` : "Waiting for the remote's handshake."}
      </p>
    </div>
  );
}
