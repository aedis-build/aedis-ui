import * as React from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { safeUrl, stripInvisible } from "@/lib/untrusted";
import { cn } from "@/lib/utils";

// Moved to untrusted; re-exported so existing imports keep working.
export { safeUrl };

export type MarkdownProps = {
  /** Markdown written by an agent or a user. Treated as untrusted. */
  children: string;
  /** Render images. Off by default: an image URL can leak the reader's IP and read receipts to a third party. */
  allowImages?: boolean;
  className?: string;
};

const components: Components = {
  a: ({ href, children, node: _node, ...props }) => {
    const url = safeUrl(href ?? "");
    if (!url) return <span>{children}</span>;
    const external = /^https?:/i.test(url);
    return (
      <a href={url} {...props} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="text-link underline underline-offset-2">
        {children}
      </a>
    );
  },
  table: ({ node: _node, ...props }) => (
    <div className="my-2 overflow-x-auto">
      <table className="w-full border-collapse text-callout" {...props} />
    </div>
  ),
  th: ({ node: _node, ...props }) => <th className="border-b border-border px-2 py-1 text-left font-medium" {...props} />,
  td: ({ node: _node, ...props }) => <td className="border-b border-border px-2 py-1" {...props} />,
  code: ({ node: _node, ...props }) => <code className="rounded-xs bg-muted px-1 py-0.5 font-mono text-[0.9em]" {...props} />,
};

/**
 * Renders untrusted markdown. Raw HTML is never rendered (react-markdown ignores it without rehype-raw),
 * links are limited to safe protocols, external ones get rel="noopener noreferrer", and hidden code points
 * (zero-width, bidi overrides, Unicode tags) are removed so nothing is shown differently from what it says.
 */
function Markdown({ children, allowImages = false, className }: MarkdownProps) {
  return (
    <div data-slot="markdown" className={cn("space-y-2 break-words [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        urlTransform={safeUrl}
        disallowedElements={allowImages ? [] : ["img"]}
        unwrapDisallowed
        components={components}
      >
        {stripInvisible(children)}
      </ReactMarkdown>
    </div>
  );
}

export { Markdown };
