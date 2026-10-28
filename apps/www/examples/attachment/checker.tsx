"use client";

import * as React from "react";

import { checkAttachment, safeFileName } from "@/registry/aedis/lib/attachment";
import { Label } from "@/registry/aedis/ui/label";

const rules = { accept: ["image/png", "image/jpeg", "application/pdf"], maxBytes: 2 * 1024 * 1024 };
const problems = { type: "this type of file is not allowed", size: "larger than 2 MB", empty: "the file is empty" };

/** Choose files: each is checked against the rules before anything is uploaded, and its name made safe to show. */
export default function AttachmentChecker() {
  const [files, setFiles] = React.useState<{ name: string; verdict: string }[]>([]);
  return (
    <div className="grid w-full max-w-md gap-3">
      <Label htmlFor="att-files">Files (PNG, JPEG or PDF, up to 2 MB)</Label>
      <input
        id="att-files"
        type="file"
        multiple
        className="text-callout file:mr-3 file:rounded-sm file:border file:border-border-control file:bg-surface file:px-3 file:py-1"
        onChange={(e) =>
          setFiles(
            [...(e.currentTarget.files ?? [])].map((f) => {
              const problem = checkAttachment(f, rules);
              return { name: safeFileName(f.name), verdict: problem ? `refused: ${problems[problem]}` : "ready to upload" };
            }),
          )
        }
      />
      <ul aria-label="Checked files" className="grid gap-1 text-callout">
        {files.map((f, i) => (
          <li key={i}>
            <span className="font-mono text-footnote">{f.name}</span>: {f.verdict}
          </li>
        ))}
      </ul>
    </div>
  );
}
