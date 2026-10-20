import { act, renderHook, waitFor } from "@testing-library/react";

import { ACTIVITY_EVENT, useIdleTimeout } from "@/registry/aedis/hooks/use-idle-timeout";
import { childMessages, hostMessages, useMfContext, useMfContextHost } from "@/registry/aedis/lib/mf-context";
import { createBridge, PROTOCOL, VERSION } from "@/registry/aedis/lib/mf-bridge";

const HOST = "https://backoffice.example.com";
const CHILD = "https://agent.example.com";
const envelope = (kind: string, extra: Record<string, unknown> = {}) => ({ protocol: PROTOCOL, v: VERSION, kind, ...extra });
const event = (type: string, payload: unknown) => envelope("event", { type, payload });

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  document.documentElement.removeAttribute("style");
  delete document.documentElement.dataset.theme;
  document.body.innerHTML = "";
});

function fakeParent() {
  const parent = { postMessage: vi.fn() } as unknown as Window & { postMessage: ReturnType<typeof vi.fn> };
  vi.spyOn(window, "parent", "get").mockReturnValue(parent);
  const send = (data: unknown, origin = HOST) => act(() => void window.dispatchEvent(new MessageEvent("message", { data, origin, source: parent as never })));
  return { parent, send };
}

describe("childMessages", () => {
  it("accepts only known locales, valid themes and empty session messages", () => {
    const m = childMessages(["en", "pt-BR"]);
    expect(m["context:locale"].validate({ locale: "pt-BR" })).toBe(true);
    expect(m["context:locale"].validate({ locale: "xx" })).toBe(false);
    expect(m["context:theme"].validate({ mode: "dark" })).toBe(true);
    expect(m["context:theme"].validate({ mode: "sepia" })).toBe(false);
    expect(m["context:theme"].validate({ mode: "light", css: "body{}" })).toBe(false);
    expect(m["context:theme"].validate({ mode: "light", theme: { version: 1, name: "x", colors: { light: { primary: "url(x)" }, dark: {} } } })).toBe(false);
    expect(m["session:end"].validate({})).toBe(true);
    expect(m["session:end"].validate({ redirect: "/x" })).toBe(false);
  });
});

describe("useMfContext (embedded app)", () => {
  it("follows the host's theme and locale, validated, and ends the session with it", async () => {
    const { send } = fakeParent();
    const onSessionEnd = vi.fn();
    const { result, unmount } = renderHook(() => useMfContext({ hostOrigins: [HOST], locales: ["en", "pt-BR"], onSessionEnd }));
    send(envelope("ack"));
    send(event("context:theme", { mode: "dark", theme: { version: 1, name: "Acme", colors: { light: {}, dark: { primary: "#3565e8" } } } }));
    await waitFor(() => expect(result.current.mode).toBe("dark"));
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.documentElement.style.getPropertyValue("--primary")).toBe("#3565e8");

    send(event("context:theme", { mode: "light", theme: { version: 1, name: "Evil", colors: { light: { primary: "url(https://x)" }, dark: {} } } }));
    expect(result.current.mode).toBe("dark");
    send(event("context:locale", { locale: "pt-BR" }));
    expect(result.current.locale).toBe("pt-BR");
    send(event("context:locale", { locale: "zz" }));
    expect(result.current.locale).toBe("pt-BR");
    send(event("context:locale", { locale: "en" }), "https://evil.example");
    expect(result.current.locale).toBe("pt-BR");

    send(event("session:end", {}));
    expect(onSessionEnd).toHaveBeenCalledOnce();
    unmount();
    expect(document.documentElement.style.getPropertyValue("--primary")).toBe("");
  });

  it("tells the host about activity, at most once per period", async () => {
    const { parent, send } = fakeParent();
    renderHook(() => useMfContext({ hostOrigins: [HOST], locales: ["en"], onSessionEnd: () => {}, activityEveryMs: 60_000 }));
    send(envelope("ack"));
    const activity = () => parent.postMessage.mock.calls.filter(([m]) => m.type === "session:activity");
    act(() => void window.dispatchEvent(new Event("pointerdown")));
    act(() => void window.dispatchEvent(new Event("keydown")));
    expect(activity()).toHaveLength(1);
    expect(activity()[0][1]).toBe(HOST);
  });

  it("does nothing outside a frame", () => {
    const { result } = renderHook(() => useMfContext({ hostOrigins: [HOST], locales: ["en"], onSessionEnd: () => {} }));
    expect(result.current).toEqual({ locale: null, mode: null });
  });
});

describe("useMfContextHost", () => {
  function hostBridge() {
    const frame = document.createElement("iframe");
    document.body.append(frame);
    const child = frame.contentWindow!;
    const post = vi.spyOn(child, "postMessage").mockImplementation(() => {});
    const bridge = createBridge({ target: child, origins: [CHILD], messages: hostMessages });
    const send = (data: unknown) => act(() => void window.dispatchEvent(new MessageEvent("message", { data, origin: CHILD, source: child })));
    return { bridge, post, send };
  }

  it("sends theme and locale after the handshake and again when they change", async () => {
    const { bridge, post, send } = hostBridge();
    const { rerender } = renderHook((ctx: { locale: string }) => useMfContextHost(bridge, { mode: "light", locale: ctx.locale }), { initialProps: { locale: "en" } });
    send(envelope("ack"));
    await waitFor(() => expect(post.mock.calls.some(([m]) => (m as { type?: string }).type === "context:locale")).toBe(true));
    rerender({ locale: "es" });
    await waitFor(() => expect(post.mock.calls.at(-1)).toEqual([event("context:locale", { locale: "es" }), CHILD]));
    expect(post.mock.calls.find(([m]) => (m as { type?: string }).type === "context:theme")![0]).toEqual(event("context:theme", { mode: "light" }));
    bridge.close();
  });

  it("relays the child's activity to the idle timeout and ends the child's session on logout", async () => {
    vi.useFakeTimers();
    const { bridge, post, send } = hostBridge();
    const onIdle = vi.fn();
    renderHook(() => useIdleTimeout(1000, onIdle));
    const { result } = renderHook(() => useMfContextHost(bridge, { mode: "dark", locale: "en" }));
    send(envelope("ack"));
    act(() => vi.advanceTimersByTime(800));
    send(event("session:activity", {}));
    act(() => vi.advanceTimersByTime(800));
    expect(onIdle).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(300));
    expect(onIdle).toHaveBeenCalledOnce();
    act(() => void result.current());
    expect(post.mock.calls.at(-1)).toEqual([event("session:end", {}), CHILD]);
    bridge.close();
  });

  it("does nothing without a bridge", () => {
    const { result } = renderHook(() => useMfContextHost(null, { mode: "light", locale: "en" }));
    expect(() => result.current()).not.toThrow();
  });

  it("counts ACTIVITY_EVENT as activity", () => {
    vi.useFakeTimers();
    const onIdle = vi.fn();
    renderHook(() => useIdleTimeout(1000, onIdle));
    act(() => vi.advanceTimersByTime(900));
    act(() => void window.dispatchEvent(new Event(ACTIVITY_EVENT)));
    act(() => vi.advanceTimersByTime(900));
    expect(onIdle).not.toHaveBeenCalled();
  });
});
