import { vi } from "vitest";
import "@testing-library/jest-dom";

// Mock global Audio
global.Audio = class {
  constructor() {}
  play() { return Promise.resolve(); }
  pause() {}
  catch() {}
};

// Mock Notification API
global.Notification = class {
  static permission = "granted";
  static requestPermission() { return Promise.resolve("granted"); }
  constructor() {}
};

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
