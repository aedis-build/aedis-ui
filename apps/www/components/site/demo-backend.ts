"use client";

import * as React from "react";

/** A request the simulated backend answers; anything else goes to the network as usual. */
export type DemoRoute = (request: Request) => Response | Promise<Response> | undefined;

const routes = new Set<DemoRoute>();
let real: typeof fetch | null = null;

/**
 * The docs site is static: demos of api(), event streams and the BFF talk to a backend simulated in the page. While
 * a demo is mounted, fetch to its paths is answered here; the real fetch is put back when the last demo unmounts.
 */
export function useDemoBackend(route: DemoRoute) {
  const latest = React.useRef(route);
  latest.current = route;
  React.useEffect(() => {
    const mine: DemoRoute = (req) => latest.current(req);
    routes.add(mine);
    if (!real) {
      real = window.fetch;
      const network = real;
      window.fetch = async (input, init) => {
        const request = new Request(input, init);
        for (const r of routes) {
          const answer = await r(request.clone());
          if (answer) return answer;
        }
        return network(input, init);
      };
    }
    return () => {
      routes.delete(mine);
      if (!routes.size && real) {
        window.fetch = real;
        real = null;
      }
    };
  }, []);
}

/** A text/event-stream body that sends each event after `everyMs`. */
export function sseBody(events: { event?: string; data: unknown }[], everyMs = 600) {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      for (const e of events) {
        await new Promise((r) => setTimeout(r, everyMs));
        controller.enqueue(encoder.encode(`${e.event ? `event: ${e.event}\n` : ""}data: ${JSON.stringify(e.data)}\n\n`));
      }
      controller.close();
    },
  });
}
