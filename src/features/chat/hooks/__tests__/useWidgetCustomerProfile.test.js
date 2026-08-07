import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { useWidgetCustomerProfile } from "../useWidgetCustomerProfile";

describe("useWidgetCustomerProfile Custom Hook", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("initializes or generates visitorSessionId in localStorage", () => {
    const { result } = renderHook(() => useWidgetCustomerProfile());

    expect(result.current.visitorSessionId).toBeTruthy();
    expect(result.current.visitorSessionId).toContain("visitor_");
    expect(result.current.hasRegisteredBefore).toBe(false);
  });

  it("persists updated profile to localStorage and updates state", () => {
    const { result } = renderHook(() => useWidgetCustomerProfile());

    act(() => {
      result.current.saveCustomerProfile("John Doe", "john@example.com", "+1234567890");
    });

    expect(result.current.hasRegisteredBefore).toBe(true);
    expect(localStorage.getItem("bo_visitor_name")).toBe("John Doe");
    expect(localStorage.getItem("bo_visitor_email")).toBe("john@example.com");
    expect(localStorage.getItem("bo_visitor_phone")).toBe("+1234567890");
  });
});
