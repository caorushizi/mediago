import { setTimeout as delay } from "node:timers/promises";
import type { ElectronApplication, Page } from "@playwright/test";
import { withDeadline } from "./electron-process.ts";

const MAIN_WINDOW_URL = "http://localhost:8500/";
const MAIN_WINDOW_TIMEOUT_MS = 10_000;

export async function waitForElectronMainWindow(
  application: ElectronApplication,
  timeoutMs = MAIN_WINDOW_TIMEOUT_MS,
): Promise<Page> {
  const deadline = Date.now() + timeoutMs;
  let stage = "first window";
  const startup = async (): Promise<Page> => {
    await application.firstWindow({ timeout: timeoutMs });
    stage = "main window URL";
    let page = application
      .windows()
      .find((candidate) => candidate.url() === MAIN_WINDOW_URL);
    while (!page && Date.now() < deadline) {
      // oxlint-disable-next-line no-await-in-loop -- Observe the existing target without depending on renderer animation frames.
      await delay(50);
      page = application
        .windows()
        .find((candidate) => candidate.url() === MAIN_WINDOW_URL);
    }
    if (!page) throw new Error("Electron main window was not available");

    stage = "document, preload bridge and visible navigation";
    await page.waitForFunction(
      () => {
        const link = document.querySelector('aside a[href="/"]');
        if (!(link instanceof HTMLElement)) return false;
        const style = getComputedStyle(link);
        const bounds = link.getBoundingClientRect();
        return (
          document.readyState !== "loading" &&
          typeof (
            window as Window & {
              electron?: { app?: { getEnvPath?: unknown } };
            }
          ).electron?.app?.getEnvPath === "function" &&
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          style.visibility !== "collapse" &&
          bounds.width > 0 &&
          bounds.height > 0
        );
      },
      undefined,
      // Hidden/unpainted Electron windows may not deliver animation frames.
      { timeout: Math.max(1, deadline - Date.now()), polling: 100 },
    );
    return page;
  };
  // Keep a Node-side deadline as well: renderer/transport stalls must leave
  // enough of the fixture's budget to terminate owned processes and free ports.
  try {
    return await withDeadline(
      startup(),
      timeoutMs,
      "Electron main window startup",
    );
  } catch (cause) {
    throw new Error(`Electron startup failed while waiting for ${stage}`, {
      cause,
    });
  }
}
