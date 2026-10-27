import { act, fireEvent, render, renderHook } from "@testing-library/react";

import { useIdleTimeout } from "@/registry/aedis/hooks/use-idle-timeout";

function Probe({ onIdle, enabled = true }: { onIdle: () => void; enabled?: boolean }) {
  useIdleTimeout(1000, onIdle, enabled);
  return null;
}

describe("useIdleTimeout", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("fires after the idle period and activity restarts the countdown", () => {
    const onIdle = vi.fn();
    render(<Probe onIdle={onIdle} />);
    act(() => void vi.advanceTimersByTime(800));
    fireEvent.keyDown(window);
    act(() => void vi.advanceTimersByTime(800));
    expect(onIdle).not.toHaveBeenCalled();
    act(() => void vi.advanceTimersByTime(200));
    expect(onIdle).toHaveBeenCalledOnce();
  });

  it("warns before the end, and Escape or stay() keeps the session (#162)", () => {
    const onIdle = vi.fn();
    const { result } = renderHook(() => useIdleTimeout(1000, onIdle, true, 300));
    act(() => void vi.advanceTimersByTime(700));
    expect(result.current.warning).toBe(true);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(result.current.warning).toBe(false);
    act(() => void vi.advanceTimersByTime(700));
    expect(result.current.warning).toBe(true);
    act(() => result.current.stay());
    act(() => void vi.advanceTimersByTime(900));
    expect(onIdle).not.toHaveBeenCalled();
    act(() => void vi.advanceTimersByTime(100));
    expect(onIdle).toHaveBeenCalledOnce();
    expect(result.current.warning).toBe(false);
  });

  it("fires at once when the tab comes back past the limit", () => {
    const onIdle = vi.fn();
    render(<Probe onIdle={onIdle} />);
    vi.setSystemTime(Date.now() + 5000);
    fireEvent(document, new Event("visibilitychange"));
    expect(onIdle).toHaveBeenCalledOnce();
  });

  it("does nothing while disabled and stops listening on unmount", () => {
    const onIdle = vi.fn();
    const { unmount, rerender } = render(<Probe onIdle={onIdle} enabled={false} />);
    act(() => void vi.advanceTimersByTime(2000));
    expect(onIdle).not.toHaveBeenCalled();
    rerender(<Probe onIdle={onIdle} />);
    unmount();
    act(() => void vi.advanceTimersByTime(2000));
    expect(onIdle).not.toHaveBeenCalled();
  });
});
