"use client";

import * as React from "react";

import { Feedback } from "@/registry/aedis/ui/feedback";

/** The docs site is static, so the example answers the feedback request itself. */
export function FeedbackExample() {
  React.useEffect(() => {
    const original = window.fetch;
    window.fetch = async (input, init) =>
      String(input) === "/api/example-feedback" ? new Response(null, { status: 204 }) : original(input, init);
    return () => {
      window.fetch = original;
    };
  }, []);
  return <Feedback messageId="example-answer-1" endpoint="/api/example-feedback" />;
}
