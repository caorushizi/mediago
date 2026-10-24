import type { ElectronApplication } from "@playwright/test";
import { expect, test, vi } from "vitest";
import { waitForElectronMainWindow } from "./electron-window.ts";

test("a wedged renderer operation is bounded by the host deadline", async () => {
  vi.useFakeTimers();
  const page = {
    url: () => "http://localhost:8500/",
    waitForFunction: vi.fn(() => new Promise(() => {})),
  };
  const application = {
    firstWindow: async () => page,
    windows: () => [page],
  } as unknown as ElectronApplication;
  try {
    const startup = waitForElectronMainWindow(application, 100);
    const rejection = expect(startup).rejects.toMatchObject({
      message:
        "Electron startup failed while waiting for document, preload bridge and visible navigation",
      cause: expect.objectContaining({
        message: "Electron main window startup timed out after 100ms",
      }),
    });
    await vi.advanceTimersByTimeAsync(100);
    await rejection;
  } finally {
    vi.useRealTimers();
  }
});
