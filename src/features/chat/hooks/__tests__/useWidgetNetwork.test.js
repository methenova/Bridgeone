import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useWidgetNetwork } from "../useWidgetNetwork";

describe("useWidgetNetwork Custom Hook", () => {
  it("initializes with current navigator.onLine status", () => {
    const { result } = renderHook(() => useWidgetNetwork());
    expect(result.current.isOnline).toBe(true);
  });

  it("updates state when window fires offline and online events", () => {
    const { result } = renderHook(() => useWidgetNetwork());

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    expect(result.current.isOnline).toBe(false);

    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    expect(result.current.isOnline).toBe(true);
  });

  it("cleans up event listeners on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useWidgetNetwork());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith("online", expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith("offline", expect.any(Function));
    removeEventListenerSpy.mockRestore();
  });
});
