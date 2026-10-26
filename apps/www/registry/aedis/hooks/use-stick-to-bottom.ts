"use client";

import * as React from "react";

// How close to the end still counts as "at the end": a line of text, so a fraction of a pixel never unsticks it.
const SLACK = 32;

/**
 * Keeps a scrolling log at its end while the reader is there, and leaves it alone once they scroll up to read.
 * Only the log scrolls, never the page around it (scrollIntoView would move every scrolling ancestor). `jump` goes
 * back to the end and sticks again.
 */
export function useStickToBottom<T extends HTMLElement>() {
  const ref = React.useRef<T>(null);
  const stuck = React.useRef(true);
  const [atBottom, setAtBottom] = React.useState(true);

  React.useEffect(() => {
    const log = ref.current;
    if (!log) return;
    const end = () => {
      log.scrollTop = log.scrollHeight;
    };
    const onScroll = () => {
      stuck.current = log.scrollHeight - log.scrollTop - log.clientHeight <= SLACK;
      setAtBottom(stuck.current);
    };
    // New messages, streamed tokens and late layout all change the content: follow it only while stuck.
    const follow = () => {
      if (stuck.current) end();
    };
    const mutations = new MutationObserver(follow);
    mutations.observe(log, { childList: true, subtree: true, characterData: true });
    const sizes = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(follow);
    sizes?.observe(log);
    log.addEventListener("scroll", onScroll, { passive: true });
    end();
    return () => {
      mutations.disconnect();
      sizes?.disconnect();
      log.removeEventListener("scroll", onScroll);
    };
  }, []);

  const jump = React.useCallback(() => {
    const log = ref.current;
    if (!log) return;
    stuck.current = true;
    setAtBottom(true);
    log.scrollTop = log.scrollHeight;
  }, []);

  return { ref, atBottom, jump };
}
