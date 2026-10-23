"use client";

import { HandRaise } from "@/registry/aedis/ui/hand-raise";

const wait = () => new Promise<null>((r) => setTimeout(() => r(null), 500));

/** Docs example without a backend. */
export default function HandRaiseDemo() {
  return (
    <HandRaise
      agent="Otto"
      question="Can we prospect direct competitors of clients we already serve?"
      tried="Read the sales policy; asked Rafael."
      onAnswer={wait}
    />
  );
}
