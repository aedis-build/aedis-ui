import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import fc from "fast-check";

import { embeddedAppHeaders, hostAppHeaders } from "@/lib/mf-embed-headers";
import { securityHeaders } from "@/lib/security-headers";
import { PROTOCOL, VERSION } from "@/registry/aedis/lib/mf-bridge";
import { frameSandbox, MfFrame, RESIZE, useReportHeight } from "@/registry/aedis/ui/mf-frame";
import { violations } from "./a11y";

const AGENT = "https://agent.example.com";
const HOST = window.location.origin;
const envelope = (kind: string, extra: Record<string, unknown> = {}) => ({ protocol: PROTOCOL, v: VERSION, kind, ...extra });

afterEach(() => vi.restoreAllMocks());

describe("frameSandbox", () => {
  it("keeps known tokens and refuses allow-same-origin for a same-origin frame", () => {
    expect(frameSandbox(["allow-scripts", "allow-same-origin", "allow-top-navigation", "allow-popups-to-escape-sandbox"], AGENT, HOST)).toEqual(["allow-scripts", "allow-same-origin"]);
    expect(frameSandbox(["allow-scripts", "allow-same-origin"], HOST, HOST)).toEqual(["allow-scripts"]);
  });

  it("never yields allow-same-origin for the host's own origin, nor an unknown token (property)", () => {
    fc.assert(
      fc.property(fc.array(fc.oneof(fc.constantFrom("allow-scripts", "allow-same-origin", "allow-forms", "allow-top-navigation"), fc.string())), (tokens) => {
        const out = frameSandbox(tokens, HOST, HOST);
        expect(out).not.toContain("allow-same-origin");
        expect(out).not.toContain("allow-top-navigation");
      }),
    );
  });
});

describe("MfFrame", () => {
  it("renders a titled, sandboxed frame with an empty permissions policy and a referrer policy", async () => {
    const { container } = render(<MfFrame src={`${AGENT}/panel`} title="Agent panel" sandbox={["allow-scripts", "allow-same-origin", "allow-forms"]} />);
    const frame = await screen.findByTitle("Agent panel");
    expect(frame).toHaveAttribute("sandbox", "allow-scripts allow-same-origin allow-forms");
    expect(frame).toHaveAttribute("allow", "");
    expect(frame).toHaveAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    expect(container.querySelector("[data-slot=skeleton]")).not.toBeNull();
    expect(frame.className).toContain("motion-reduce:transition-none");
    expect(await violations(container)).toEqual([]);
  });

  it("drops allow-same-origin when the frame is on the host's origin", async () => {
    render(<MfFrame src={`${HOST}/embedded`} title="Same origin" sandbox={["allow-scripts", "allow-same-origin"]} />);
    expect(await screen.findByTitle("Same origin")).toHaveAttribute("sandbox", "allow-scripts");
  });

  it("renders nothing for a URL that is not http(s)", () => {
    const { container } = render(<MfFrame src="javascript:alert(1)" title="Evil" />);
    expect(container.innerHTML).toBe("");
  });

  it("takes its height from the embedded app over the bridge, bounded, and ignores other origins", async () => {
    const onBridge = vi.fn();
    render(<MfFrame src={`${AGENT}/panel`} title="Agent panel" minHeight={100} maxHeight={600} onBridge={onBridge} />);
    const frame = (await screen.findByTitle("Agent panel")) as HTMLIFrameElement;
    await waitFor(() => expect(onBridge).toHaveBeenCalled());
    const child = frame.contentWindow!;
    const send = (data: unknown, origin = AGENT) => act(() => void window.dispatchEvent(new MessageEvent("message", { data, origin, source: child })));
    send(envelope("ready"));
    send(envelope("event", { type: RESIZE, payload: { height: 420.4 } }));
    await waitFor(() => expect(frame.style.height).toBe("420px"));
    send(envelope("event", { type: RESIZE, payload: { height: 99999 } }));
    expect(frame.style.height).toBe("600px");
    send(envelope("event", { type: RESIZE, payload: { height: 5 } }), "https://evil.example");
    expect(frame.style.height).toBe("600px");
    send(envelope("event", { type: RESIZE, payload: { height: -50 } }));
    expect(frame.style.height).toBe("100px");
    expect(document.querySelector("[data-slot=skeleton]")).toBeNull();
  });
});

describe("useReportHeight", () => {
  it("does nothing outside a frame", () => {
    const { result } = renderHook(() => useReportHeight([HOST]));
    expect(result.current).toBeNull();
  });

  it("reports the document height to the host once the handshake is done", async () => {
    const parent = { postMessage: vi.fn() } as unknown as Window;
    vi.spyOn(window, "parent", "get").mockReturnValue(parent);
    const { result, unmount } = renderHook(() => useReportHeight(["https://backoffice.example.com"]));
    await waitFor(() => expect(result.current).not.toBeNull());
    act(() => void window.dispatchEvent(new MessageEvent("message", { data: envelope("ack"), origin: "https://backoffice.example.com", source: parent as never })));
    await waitFor(() =>
      expect((parent.postMessage as ReturnType<typeof vi.fn>).mock.calls.some(([m, o]) => m.kind === "event" && m.type === RESIZE && o === "https://backoffice.example.com")).toBe(true),
    );
    unmount();
  });
});

describe("embed headers", () => {
  const csp = (h: Record<string, string>) => Object.fromEntries(h["Content-Security-Policy"].split("; ").map((d) => [d.split(" ")[0], d]));

  it("lets only configured hosts frame the embedded app, never a wildcard", () => {
    expect(csp(embeddedAppHeaders({ nonce: "n", hostOrigins: ["https://backoffice.example.com", "*", "https://*.evil.com"] }))["frame-ancestors"]).toBe("frame-ancestors https://backoffice.example.com");
    expect(csp(embeddedAppHeaders({ nonce: "n", hostOrigins: ["*"] }))["frame-ancestors"]).toBe("frame-ancestors 'none'");
  });

  it("lets the host frame only configured apps", () => {
    expect(csp(hostAppHeaders({ nonce: "n", frameOrigins: [AGENT, "*"] }))["frame-src"]).toBe(`frame-src ${AGENT}`);
    expect(csp(hostAppHeaders({ nonce: "n", frameOrigins: [] }))["frame-src"]).toBe("frame-src 'none'");
  });

  it("securityHeaders itself never accepts a wildcard ancestor and keeps 'self'", () => {
    expect(csp(securityHeaders({ nonce: "n", frameAncestors: ["'self'", "*", "https://portal.example.com/"] }))["frame-ancestors"]).toBe("frame-ancestors 'self' https://portal.example.com");
    expect(csp(securityHeaders({ nonce: "n" }))["frame-src"]).toBeUndefined();
  });
});
