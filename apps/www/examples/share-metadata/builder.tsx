"use client";

import * as React from "react";

import { shareMetadata } from "@/registry/aedis/lib/share-metadata";
import { Input } from "@/registry/aedis/ui/input";
import { Label } from "@/registry/aedis/ui/label";

/** The tags shareMetadata writes for a page: change the inputs and see what a link preview will read. */
export default function ShareMetadataBuilder() {
  const [title, setTitle] = React.useState("Selected work");
  const [image, setImage] = React.useState("https://rlfn.studio/og/work.png");
  let tags: [string, string | undefined][];
  try {
    const m = shareMetadata({
      site: { origin: "https://rlfn.studio", name: "RLFN Studio" },
      url: "https://rlfn.studio/work",
      title,
      description: "Identity, websites and film for small companies.",
      image: { url: image, alt: `${title} · RLFN Studio` },
    });
    const og = m.openGraph as { title?: string; url?: string; images?: { url: string }[] };
    tags = [
      ["og:title", og.title],
      ["og:url", og.url],
      ["og:image", og.images?.[0]?.url],
      ["twitter:card", (m.twitter as { card?: string }).card],
    ];
  } catch (e) {
    // It refuses rather than publish a tag that points away from the site.
    tags = [["refused", (e as Error).message]];
  }
  return (
    <div className="grid w-full max-w-xl gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="sm-title">Title</Label>
          <Input id="sm-title" value={title} maxLength={120} onChange={(e) => setTitle(e.currentTarget.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="sm-image">Image URL</Label>
          <Input id="sm-image" value={image} maxLength={300} onChange={(e) => setImage(e.currentTarget.value)} />
        </div>
      </div>
      <dl aria-label="Tags" className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono text-footnote">
        {tags.map(([k, v]) => (
          <React.Fragment key={k}>
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="break-all">{v}</dd>
          </React.Fragment>
        ))}
      </dl>
    </div>
  );
}
